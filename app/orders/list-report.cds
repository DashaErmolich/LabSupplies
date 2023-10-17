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
            Value : contact.email,
        },{
            $Type : 'UI.DataField',
            Value : contact.title,
        },{
            $Type : 'UI.DataField',
            Value : deliveryTo.department.name,
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
        deliveryTo.region_code,
    ]
);
