---
name: generate-apex-test

description: You are an expert Salesforce Apex test engineer. Generate, validate, and fix Apex test classes following Salesforce best practices for coverage, isolation, and maintainability.
---

## Trigger conditions

Use this skill when the user asks to:
- Create or generate Apex test classes (`*Test.cls`, `*_Test.cls`)
- Improve or analyze code coverage for Apex classes or triggers
- Debug, fix, or interpret failing Apex test results
- Run test execution and review coverage reports (`sf apex run test`)
- Implement test patterns for triggers, service classes, controllers, batch jobs, queueables, schedulables, or HTTP callout integrations

## Do NOT trigger for

- Writing production Apex classes or triggers (use `generate-apex` skill instead)
- Salesforce admin/declarative configuration
- LWC JavaScript unit tests (use Jest patterns instead)


## Core Principles

- One behavior per method — each test method validates a single scenario. Separate positive, negative, and bulk tests. NEVER combine related-but-distinct inputs (e.g., null and empty) in one method — create _NullInput_ and _EmptyInput_ as separate test methods
- Bulkify tests — test with 251+ records to cross the 200-record trigger batch boundary. Batch Apex exception: in test context only one execute() invocation runs, so set batchSize >= testRecordCount. See references/async-testing.md
- Isolate test data — every @TestSetup must delegate record creation to a TestDataFactory class. If none exists, create one first. Never build record lists inline in @TestSetup. Never rely on org data (SeeAllData=false) or hardcoded IDs. For duplicate rule handling, see references/test-data-factory.md
- Assert meaningfully — use exact expected values computed from test data setup. NEVER use range assertions or approximate counts when the value is deterministic. Always include failure messages. See references/assertion-patterns.md
- Use Assert class only — Assert.areEqual, Assert.isTrue, Assert.fail, etc. Never use legacy System.assert, System.assertEquals, or System.assertNotEquals
- Mock external boundaries — use HttpCalloutMock for callouts, Test.setFixedSearchResults for SOSL, DML mock classes for database isolation. Design for testability via constructor injection. See references/mocking-patterns.md
- Test negative paths — validate error handling and exception scenarios, not just happy paths
- Wrap with start/stop — pair Test.startTest() with Test.stopTest() to reset governor limits and force async execution
---

## Instructions

### Step 1 — Understand the production code

Before generating any test, read the production class or trigger under test:

1. Identify the **class type**: service, controller, trigger handler, batch, queueable, schedulable, REST resource, callout integration
2. Note all **public/global methods** and their signatures
3. Identify **DML operations**, **SOQL queries**, **callouts**, **platform events**, and **async calls**
4. Check for `with sharing` / `without sharing` and security model expectations
5. Note any **custom settings**, **custom metadata**, or **static configuration** the code reads

Ask the user to provide the production class if not visible in context.

---

### Step 2 — Choose the correct test pattern

Select the appropriate pattern based on class type:

#### Trigger / Trigger Handler
```apex
@IsTest
private class AccountTriggerHandlerTest {
    @TestSetup
    static void makeData() {
        // Insert minimal shared test records once
    }

    @IsTest
    static void insertAccount_setsDefaultRating() {
        Test.startTest();
        Account acc = new Account(Name = 'Test Co');
        insert acc;
        Test.stopTest();

        acc = [SELECT Rating FROM Account WHERE Id = :acc.Id];
        Assert.areEqual('Warm', acc.Rating, 'Default rating should be Warm');
    }
}
```

#### Service / Utility Class
```apex
@IsTest
private class OpportunityServiceTest {
    @TestSetup
    static void makeData() {
        Account acc = TestDataFactory.createAccount(true);
    }

    @IsTest
    static void calculateDiscount_returnsCorrectRate() {
        Opportunity opp = [SELECT Id, Amount FROM Opportunity LIMIT 1];
        Test.startTest();
        Decimal rate = OpportunityService.calculateDiscount(opp);
        Test.stopTest();
        Assert.areEqual(0.10, rate, 'Discount should be 10%');
    }

    @IsTest
    static void calculateDiscount_nullAmount_returnsZero() {
        Opportunity opp = new Opportunity(Amount = null);
        Test.startTest();
        Decimal rate = OpportunityService.calculateDiscount(opp);
        Test.stopTest();
        Assert.areEqual(0, rate, 'Null amount should yield zero discount');
    }
}
```

#### Batch Apex
```apex
@IsTest
private class LeadCleanupBatchTest {
    @TestSetup
    static void makeData() {
        List<Lead> leads = new List<Lead>();
        for (Integer i = 0; i < 200; i++) {
            leads.add(new Lead(LastName = 'Test' + i, Company = 'Acme', Status = 'Open'));
        }
        insert leads;
    }

    @IsTest
    static void batch_processesAllRecords() {
        Test.startTest();
        Database.executeBatch(new LeadCleanupBatch(), 200);
        Test.stopTest();

        Integer remaining = [SELECT COUNT() FROM Lead WHERE Status = 'Open'];
        Assert.areEqual(0, remaining, 'All open leads should be closed');
    }
}
```

#### Queueable / Future
```apex
@IsTest
private class ContactSyncQueueableTest {
    @IsTest
    static void enqueue_updatesContact() {
        Contact c = new Contact(LastName = 'Sync', Email = 'sync@test.com');
        insert c;

        Test.startTest();
        System.enqueueJob(new ContactSyncQueueable(c.Id));
        Test.stopTest();

        c = [SELECT Synced__c FROM Contact WHERE Id = :c.Id];
        Assert.isTrue(c.Synced__c, 'Contact should be marked synced');
    }
}
```

#### HTTP Callout / Integration
```apex
@IsTest
private class PaymentGatewayServiceTest {
    @IsTest
    static void callout_successResponse_setsApproved() {
        Test.setMock(HttpCalloutMock.class, new PaymentSuccessMock());

        Test.startTest();
        String result = PaymentGatewayService.processPayment('tok_test_123', 100);
        Test.stopTest();

        Assert.areEqual('APPROVED', result);
    }

    private class PaymentSuccessMock implements HttpCalloutMock {
        public HttpResponse respond(HttpRequest req) {
            HttpResponse res = new HttpResponse();
            res.setStatusCode(200);
            res.setBody('{"status":"APPROVED"}');
            return res;
        }
    }
}
```

#### Schedulable
```apex
@IsTest
private class ReportSchedulerTest {
    @IsTest
    static void schedule_executesWithoutError() {
        Test.startTest();
        String jobId = System.schedule(
            'Test Report Scheduler',
            '0 0 2 * * ?',
            new ReportScheduler()
        );
        Test.stopTest();

        CronTrigger ct = [SELECT Id, CronExpression FROM CronTrigger WHERE Id = :jobId];
        Assert.isNotNull(ct, 'Scheduled job should exist');
    }
}
```

---

### Step 3 — Apply mocking strategies

#### For Apex callouts — `HttpCalloutMock`
- Always implement `HttpCalloutMock` as a private inner class in the test file
- Provide separate mocks for success, error (4xx/5xx), and malformed-response scenarios
- Never make real HTTP calls in tests

#### For static dependencies — `StubProvider` (API 46+)
- Use `Test.createStub(Type, StubProvider)` to mock interfaces and virtual classes
- Prefer dependency injection in production code to enable stubbing

#### For external services and integrations
- Use `Test.setMock(WebServiceMock.class, ...)` for SOAP-based services
- Populate custom settings / custom metadata in `@TestSetup` instead of relying on org data

#### For Platform Events / Change Data Capture
```apex
Test.startTest();
EventBus.publish(new Order_Event__e(OrderId__c = orderId));
Test.stopTest();
// Assertions run after Test.stopTest() flushes the event bus
```

---

### Step 4 — Apply assertion best practices

| Rule | Correct | Wrong |
|------|---------|-------|
| Use `Assert.*` (v58+) | `Assert.areEqual(expected, actual, msg)` | `System.assertEquals(...)` |
| Always include a message | `Assert.areEqual(5, count, 'Should find 5 records')` | `Assert.areEqual(5, count)` |
| Expected before actual | `Assert.areEqual(expected, actual, msg)` | `Assert.areEqual(actual, expected, msg)` |
| Test negative paths | Dedicated method for each error/exception path | Skipping exception coverage |
| One logical assertion per test | Group only truly related field checks | One giant test method |
| Re-query after DML | `[SELECT Field FROM Obj WHERE Id = :id]` | Asserting on the pre-DML in-memory object |

**Exception testing pattern:**
```apex
@IsTest
static void methodName_invalidInput_throwsException() {
    Boolean exceptionThrown = false;
    try {
        SomeService.methodThatThrows(null);
    } catch (IllegalArgumentException e) {
        exceptionThrown = true;
        Assert.isTrue(e.getMessage().contains('required'), 'Message should indicate required field');
    }
    Assert.isTrue(exceptionThrown, 'Expected IllegalArgumentException was not thrown');
}
```

---

### Step 5 — Structure the test class

```apex
/**
 * Tests for [ClassName]. Covers [brief scope description].
 */
@IsTest
private class [ClassName]Test {

    // ── Test Data Setup ─────────────────────────────────────────────────────
    @TestSetup
    static void makeData() {
        // Insert reusable records shared across all test methods
        // Keep minimal — only what the majority of tests need
    }

    // ── Happy Path ───────────────────────────────────────────────────────────
    @IsTest
    static void methodName_condition_expectedOutcome() { }

    // ── Edge Cases ───────────────────────────────────────────────────────────
    @IsTest
    static void methodName_edgeCase_expectedOutcome() { }

    // ── Negative / Error Paths ───────────────────────────────────────────────
    @IsTest
    static void methodName_invalidInput_throwsException() { }

    // ── Bulk / Governor Limits ───────────────────────────────────────────────
    @IsTest
    static void methodName_200Records_completesWithinLimits() { }

    // ── Mocks / Helpers (inner classes) ─────────────────────────────────────
    private class SomeMock implements HttpCalloutMock { }
}
```

**Naming convention:** `methodName_condition_expectedOutcome` (snake_case segments, camelCase within)

---

### Step 6 — Run tests and interpret results

After generating, run tests:
Start narrow when debugging; widen after the fix is stable.

```bash
# Single test class
sf apex run test --class-names [ClassName]Test --result-format human --code-coverage --target-org <alias>

# Specific test methods
sf apex run test --tests [ClassName]Test.[MethodName] --result-format human --target-org <alias>

# All local tests
sf apex run test --test-level RunLocalTests --result-format human --code-coverage --target-org <alias>
```

**Interpret output fields:**
- `outcome: Pass/Fail` — test method result
- `message` + `stackTrace` — root cause of failures
- `numLocations` — lines not covered (from coverage report)
- `ApexCodeCoverageAggregate` — overall % per class

---

### Step 7 — Test-fix loop

When tests fail, follow this disciplined loop:

```
1. READ the failure message and stack trace carefully
2. IDENTIFY the root cause category:
   │
   ├── NullPointerException → Missing test data setup or uninitialized variable
   ├── DML / SOQL in test without SeeAllData → Use @TestSetup or factory
   ├── Callout without mock → Add HttpCalloutMock or WebServiceMock
   ├── AsyncApex not flushed → Wrap in Test.startTest() / Test.stopTest()
   ├── Assertion mismatch → Re-query after DML; check expected vs actual order
   ├── Governor limit → Reduce SOQL/DML in loops; check test data volume
   └── Missing permission → Run as specific user with System.runAs()

3. FIX only the failing test or the production code if it has a defect. Apply fix — adjust test data or assertions for test-side issues; delegate production code issues to the generate-apex skill
4. RE-RUN the test class
5. REPEAT until all methods pass
6. VERIFY coverage meets the 75% org minimum (aim for 90%+)
```

**Never suppress or comment out failing tests.** Fix the root cause.

---

### Step 8 — Coverage gap analysis

If coverage is below target, identify uncovered lines:

```bash
sf apex run test --class-names [ClassName]Test --code-coverage --result-format json --wait 10 \
  | jq '.result.coverage.coverage[] | select(.name == "[ClassName]") | .uncoveredLines'
```

For each uncovered line:
1. Determine which condition / branch it belongs to
2. Write a dedicated test method that exercises that path
3. Re-run and verify the line is now covered

---

### Output checklist

Before delivering the test class, verify:

- [ ] `@IsTest` annotation on class; `private` visibility
- [ ] `@TestSetup` used for shared data (not repeated in each method)
- [ ] Every `@IsTest` method is `static void`
- [ ] `Test.startTest()` / `Test.stopTest()` wraps async and governor-limit-sensitive code
- [ ] All callouts use `Test.setMock()`
- [ ] `Assert.*` used (not `System.assert*`)
- [ ] Expected value is the first argument to `Assert.areEqual`
- [ ] All assertions include a descriptive message string
- [ ] Negative / exception paths are tested
- [ ] Bulk test with ≥ 200 records for trigger and batch classes
- [ ] No `SeeAllData=true` unless absolutely required (explain why if used)
- [ ] Test file saved as `[ClassName]Test.cls` with matching `-meta.xml`
