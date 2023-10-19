using AppService as service from '../../srv/app-service';
using from '../../db/schema';

annotate service.Orders with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : createdAt,
        },        {
            $Type : 'UI.DataField',
            Value : title,
        },{
            $Type : 'UI.DataField',
            Label: '{i18n>createdBy}',
            Value : contact.fullName,
        },
        {
            $Type : 'UI.DataField',
            Label: '{i18n>processedBy}',
            Value : contact.manager.fullName,
        },{
            $Type : 'UI.DataField',
            Value : deliveryTo.name,
        },
        {
            $Type : 'UI.DataField',
            Value : status.name,
            Criticality : status.criticalityCode,
            CriticalityRepresentation : #WithIcon,
        },]
);


annotate service.Orders with @(
    UI.SelectionFields : [
        deliveryTo.address.region_code,
    ]
);

annotate service.Orders with {
    ID @UI.Hidden;
    isApproveHidden @UI.Hidden;
    isRejectHidden @UI.Hidden;
    processor @UI.Hidden;
    deliveryTo @UI.Hidden;
    status @UI.Hidden;
}