using AppService as service from '../../srv/app-service';

annotate service.Orders with @(
    UI.LineItem           : {
        $value             : [
            {
                $Type: 'UI.DataField',
                Value: createdAt,
            },
            {
                $Type                 : 'UI.DataField',
                Value                 : title,
                ![@HTML5.CssDefaults] : {width: 'auto'},
                ![@UI.Importance]     : #High,
            },
            {
                $Type                    : 'UI.DataField',
                Value                    : status.name,
                Criticality              : status.criticalityCode,
                CriticalityRepresentation: #WithIcon,
                ![@HTML5.CssDefaults]    : {width: 'auto'},
                ![@UI.Importance]        : #High,
            },
            {
                $Type: 'UI.DataField',
                Label: '{i18n>createdBy}',
                Value: contact.fullName,
            },
            {
                $Type: 'UI.DataField',
                Label: '{i18n>processedBy}',
                Value: processor.fullName,
            },
            {
                $Type                 : 'UI.DataFieldForAnnotation',
                Label                 : '{i18n>progressIndicator}',
                Target                : '@UI.DataPoint#progress',
                ![@HTML5.CssDefaults] : {width: 'auto'},
            },
            {
                $Type                 : 'UI.DataField',
                Value                 : deliveryTo.name,
                ![@HTML5.CssDefaults] : {width: 'auto'}
            },
            {
                $Type: 'UI.DataField',
                Value: deliveryTo_ID,
                ![@UI.Hidden]
            },
            {
                $Type: 'UI.DataField',
                Value: status_ID,
                ![@UI.Hidden]
            },
            {
                $Type: 'UI.DataField',
                Value: processor_email,
                ![@UI.Hidden]
            },
            {
                $Type: 'UI.DataField',
                Value: ID,
                ![@UI.Hidden]
            },
        ],
        ![@UI.Criticality] : status.criticalityCode,
    },
    UI.DataPoint #progress: {
        $Type        : 'UI.DataPointType',
        Value        : progress,
        Title        : '{i18n>progressIndicator}',
        TargetValue  : 100,
        Visualization: #Progress,
    },
);

annotate service.Orders with @(
    UI.SelectionVariant #waitingApprove : {
        $Type        : 'UI.SelectionVariantType',
        Text         : '{i18n>waitingApproveOrders}',
        SelectOptions: [{
            $Type       : 'UI.SelectOptionType',
            PropertyName: status_ID,
            Ranges      : [{
                $Type : 'UI.SelectionRangeType',
                Sign  : #I,
                Option: #EQ,
                Low   : 'WAITING_FOR_APPROVE',
            }, ],
        }, ],
    },
    UI.SelectionVariant #waitingEdit    : {
        $Type        : 'UI.SelectionVariantType',
        Text         : '{i18n>waitingEditOrders}',
        SelectOptions: [{
            $Type       : 'UI.SelectOptionType',
            PropertyName: status_ID,
            Ranges      : [{
                $Type : 'UI.SelectionRangeType',
                Sign  : #I,
                Option: #EQ,
                Low   : 'WAITING_FOR_EDIT',
            }, ],
        }, ],
    },
    UI.SelectionVariant #waitingDelivery: {
        $Type        : 'UI.SelectionVariantType',
        Text         : '{i18n>waitingDeliveryOrders}',
        SelectOptions: [{
            $Type       : 'UI.SelectOptionType',
            PropertyName: status_ID,
            Ranges      : [{
                $Type : 'UI.SelectionRangeType',
                Sign  : #I,
                Option: #EQ,
                Low   : 'WAITING_FOR_DELIVERY',
            }, ],
        }, ],
    },
    UI.SelectionVariant #all            : {
        $Type: 'UI.SelectionVariantType',
        Text : '{i18n>allOrders}',
    },
    UI.SelectionVariant #completed      : {
        $Type        : 'UI.SelectionVariantType',
        Text         : '{i18n>completedOrders}',
        SelectOptions: [{
            $Type       : 'UI.SelectOptionType',
            PropertyName: status_ID,
            Ranges      : [{
                $Type : 'UI.SelectionRangeType',
                Sign  : #I,
                Option: #EQ,
                Low   : 'CLOSED',
            }, ],
        }, ],
    },
    UI.SelectionVariant #rejected       : {
        $Type        : 'UI.SelectionVariantType',
        Text         : '{i18n>rejectedOrders}',
        SelectOptions: [{
            $Type       : 'UI.SelectOptionType',
            PropertyName: status_ID,
            Ranges      : [{
                $Type : 'UI.SelectionRangeType',
                Sign  : #I,
                Option: #EQ,
                Low   : 'REJECTED',
            }, ],
        }, ],
    },
);

annotate service.Orders with @(UI.SelectionFields: [
    warehouseOrders.ID,
    deliveryTo.ID,
    processor.email,
]);
