import { LightningElement, wire, api } from 'lwc';
import { getRecord, getFieldValue } from 'lightning/uiRecordApi';
import { processImage } from 'lightning/mediaUtils';
import { refreshApex } from '@salesforce/apex';
import getPictures from '@salesforce/apex/PropertyController.getPictures';
import createFile from '@salesforce/apex/FileUtilities.createFile';

import ADDRESS_FIELD from '@salesforce/schema/Property__c.Address__c';
import CITY_FIELD from '@salesforce/schema/Property__c.City__c';
import DESCRIPTION_FIELD from '@salesforce/schema/Property__c.Description__c';

const FIELDS = [ADDRESS_FIELD, CITY_FIELD, DESCRIPTION_FIELD];

export default class PropertyCarousel extends LightningElement {
    @api recordId;
    carouselItems;
    pictures;

    @wire(getRecord, { recordId: '$recordId', fields: FIELDS })
    property;

    @wire(getPictures, { propertyId: '$recordId' })
    wiredPictures(pictures) {
        this.pictures = pictures;
        if (pictures.data) {
            const files = pictures.data;
            if (Array.isArray(files) && files.length) {
                this.carouselItems = files.map((file) => {
                    return {
                        title: file.Title,
                        url: `/sfc/servlet.shepherd/version/download/${file.Id}`
                    };
                });
            } else {
                this.carouselItems = null;
            }
        }
    }

    get address() {
        return getFieldValue(this.property.data, ADDRESS_FIELD);
    }

    get city() {
        return getFieldValue(this.property.data, CITY_FIELD);
    }

    get description() {
        return getFieldValue(this.property.data, DESCRIPTION_FIELD);
    }

    get errors() {
        const errors = [this.property.error, this.pictures.error].filter(
            (error) => error
        );
        return errors.length ? errors : null;
    }

    async handleFilesSelected(event) {
        try {
            const options = {
                resizeMode: 'fill',
                resizeStrategy: 'reduce',
                targetWidth: 500,
                targetHeight: 500,
                compressionQuality: 0.75,
                imageSmoothingEnabled: true,
                preserveTransparency: false,
                backgroundColor: 'white'
            };

            /* eslint-disable no-await-in-loop */
            for (const file of event.target.files) {
                const blob = await processImage(file, options);
                const base64data = await this.blobToBase64(blob);
                await createFile({
                    base64data: base64data,
                    filename: file.name,
                    recordId: this.recordId
                });
                refreshApex(this.pictures);
            }
        } catch (error) {
            console.error('Error compressing and creating file: ', error);
        }
    }

    async blobToBase64(blob) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result.split(',')[1]);
            reader.readAsDataURL(blob);
        });
    }
}