// Check if the job is already scheduled to avoid duplicates
List<CronTrigger> existing = [
    SELECT Id, CronJobDetail.Name
    FROM CronTrigger
    WHERE CronJobDetail.Name = 'Delete Stale Tasks Daily'
    AND State != 'DELETED'
];
if (existing.isEmpty()) {
    System.schedule('Delete Stale Tasks Daily', '0 0 3 * * ?', new DeleteStaleTasksScheduler());
    System.debug('Scheduled job created successfully.');
} else {
    System.debug('Job already scheduled with ID: ' + existing[0].Id);
}
