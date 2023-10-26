using AppService as service from '../../srv/app-service';
using from './annotations';

annotate service.Orders with @(
    UI.HeaderInfo            : {
        Title   : {
            $Type: 'UI.DataField',
            Value: title,
        },
        TypeName: 'Order',
    },

    UI.HeaderFacets          : [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'Contact',
            Target: '@UI.FieldGroup#Contact',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'Status',
            Target: 'status/@UI.DataPoint#Status',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'radialChart',
            Target: '@UI.Chart#radialChart',
        },
    ],
    UI.FieldGroup #Contact   : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataFieldForAnnotation',
                Target: 'contact/@Communication.Contact',
                Label : '{i18n>createdBy}',
            },
            {
                $Type : 'UI.DataFieldForAnnotation',
                Target: 'processor/@Communication.Contact',
                Label : '{i18n>processedBy}',
            },
            {
                $Type: 'UI.DataField',
                Value: reviewNotes,
                Label: '{i18n>reviewNotes}',
            },
        ],
    },
    UI.Chart #radialChart    : {
        Title            : '{i18n>progressIndicator}',
        ChartType        : #Donut,
        Measures         : [progress, ],
        MeasureAttributes: [{
            $Type    : 'UI.ChartMeasureAttributeType',
            Measure  : progress,
            Role     : #Axis1,
            DataPoint: '@UI.DataPoint#radialChart',
        }, ],
    },
    UI.DataPoint #radialChart: {
        Value      : progress,
        TargetValue: 100,
        Criticality: status.criticalityCode,
    },
);

annotate service.Orders with @(UI.Facets: [
    {
        $Type : 'UI.ReferenceFacet',
        ID    : 'Items',
        Target: 'items/@UI.PresentationVariant#Items',
        Label : '{i18n>productsInfo}',
    },
    {
        $Type : 'UI.ReferenceFacet',
        ID    : 'Delivery',
        Target: '@UI.FieldGroup#Delivery',
        Label : '{i18n>deliveryInfo}'
    },
    {
        $Type : 'UI.ReferenceFacet',
        Label : '{i18n>attachments}',
        ID    : 'Attachments',
        Target: 'attachments/@UI.LineItem#Attachments',
    },
]);

annotate AppService.OrderItems with @(UI.LineItem #Items: [
    {
        $Type: 'UI.DataField',
        Value: item_product_ID,
        Label: '{i18n>catNo}',
    },
    {
        $Type                   : 'UI.DataField',
        Value                   : item.product.title,
        ![@Common.FieldControl] : #ReadOnly,
        ![@HTML5.CssDefaults]   : {width: 'auto'}
    },
    {
        $Type                   : 'UI.DataField',
        Value                   : item.product.supplier.name,
        ![@Common.FieldControl] : #ReadOnly,
    },
    {
        $Type: 'UI.DataField',
        Value: qty,
    },
    {
        $Type                   : 'UI.DataField',
        Value                   : item.stock,
        ![@Common.FieldControl] : #ReadOnly,
    },
    {
        $Type                   : 'UI.DataField',
        Value                   : item.warehouse.name,
        ![@Common.FieldControl] : #ReadOnly,
    },
    {
        $Type: 'UI.DataField',
        Label: '{i18n>warehouseID}',
        Value: item_warehouse_ID,
        ![@UI.Hidden] ,
    },
    {
        $Type: 'UI.DataField',
        Label: '{i18n>orderID}',
        Value: order_ID,
        ![@UI.Hidden] ,
    },
    {
        $Type: 'UI.DataField',
        Value: ID,
        ![@UI.Hidden] ,
    },
]);

annotate service.Orders with @(UI.FieldGroup #Delivery: {
    $Type: 'UI.FieldGroupType',
    Data : [
        {
            $Type: 'UI.DataField',
            Label: '{i18n>departmentTitle}',
            Value: deliveryTo_ID,
        },
        {
            $Type                   : 'UI.DataField',
            Label                   : '{i18n>country}',
            Value                   : deliveryTo.address.region.country.name,
            ![@Common.FieldControl] : #ReadOnly,
        },
        {
            $Type                   : 'UI.DataField',
            Label                   : '{i18n>region}',
            Value                   : deliveryTo.address.region.name,
            ![@Common.FieldControl] : #ReadOnly,
        },
        {
            $Type                   : 'UI.DataField',
            Label                   : '{i18n>city}',
            Value                   : deliveryTo.address.city,
            ![@Common.FieldControl] : #ReadOnly,
        },
        {
            $Type                   : 'UI.DataField',
            Value                   : deliveryTo.address.postCode,
            ![@Common.FieldControl] : #ReadOnly,
        },
        {
            $Type                   : 'UI.DataField',
            Value                   : deliveryTo.address.street,
            ![@Common.FieldControl] : #ReadOnly,
        },
        {
            $Type                   : 'UI.DataField',
            Value                   : deliveryTo.address.building,
            ![@Common.FieldControl] : #ReadOnly,
        },
        {
            $Type: 'UI.DataField',
            Value: notes,
        },
    ],
});

annotate AppService.OrderItems with @(UI.PresentationVariant #Items: {
    $Type         : 'UI.PresentationVariantType',
    Visualizations: ['@UI.LineItem#Items', ],
    GroupBy       : [item.warehouse.name, ],
});

annotate AppService.OrderStatuses with @(UI.DataPoint #Status: {
    $Type      : 'UI.DataPointType',
    Value      : name,
    Title      : '{i18n>status}',
    Criticality: criticalityCode,
});

annotate AppService.Orders with @(UI.Identification: [{
    $Type             : 'UI.DataFieldForAction',
    Action            : 'AppService.rejectOrder',
    Label             : '{i18n>rejectOrder}',
    // Criticality       : 1,
    ![@UI.Hidden]     : isNotActionable,
    ![@UI.Importance] : #High,
}, ]);

annotate AppService.Contacts with @(
    Communication.Contact : {
        $Type: 'Communication.ContactType',
        org  : department.name,
        email: [{
            $Type  : 'Communication.EmailAddressType',
            type   : #work,
            address: email,
        }, ],
        fn   : fullName,
        role : title,
        tel  : [{
            $Type: 'Communication.PhoneNumberType',
            type : #work,
            uri  : tel,
        }, ],
        adr  : [{
            $Type   : 'Communication.AddressType',
            type    : #work,
            street  : department.address.street,
            locality: department.address.city,
            region  : department.address.region.name,
            code    : department.address.postCode,
            country : department.address.region.country.name,
        }, ],
        photo: photoUrl,
    },
    Common.IsNaturalPerson: true
);

annotate AppService.Attachments with @(UI.LineItem #Attachments: [
    {
        $Type: 'UI.DataField',
        Value: content,
    },
    {
        $Type: 'UI.DataField',
        Value: notes,
    },
]);

// WH ORDERS

annotate AppService.WarehouseOrders with @(
    UI.HeaderInfo            : {Title: {
        $Type: 'UI.DataField',
        Value: title,
    }, },

    UI.HeaderFacets          : [
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'WhContact',
            Target: '@UI.FieldGroup#WhContact',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'name',
            Target: 'status/@UI.DataPoint#name',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'radialChart',
            Target: '@UI.Chart#radialChart',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'daysCounter',
            Target: 'deliveryForecast/@UI.DataPoint#daysCounter',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID    : 'residualPercentage',
            Target: 'deliveryForecast/@UI.DataPoint#residualPercentage',
        },
    ],

    UI.Facets                : [
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>productsInfo}',
            ID    : 'WhOrderItems',
            Target: 'items/@UI.LineItem#WhOrderItems',
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : '{i18n>deliveryInfo}',
            ID    : 'delivery',
            Target: '@UI.FieldGroup#delivery',
        },
    ],
    UI.FieldGroup #WhContact : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataFieldForAnnotation',
                Target: 'parentOrder/contact/@Communication.Contact',
                Label : '{i18n>deliveryRequestor}',
            },
            {
                $Type : 'UI.DataFieldForAnnotation',
                Target: 'processor/@Communication.Contact',
                Label : '{i18n>processedBy}',
            },
            {
                $Type: 'UI.DataField',
                Value: deliveryForecast.predictedDate,
            },
        ],
    },
    UI.FieldGroup #delivery  : {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: parentOrder.deliveryTo.name,
            },
            {
                $Type: 'UI.DataField',
                Value: parentOrder.deliveryTo.address.region.country.name,
            },
            {
                $Type: 'UI.DataField',
                Value: parentOrder.deliveryTo.address.region.name,
                Label: '{i18n>region}',
            },
            {
                $Type: 'UI.DataField',
                Value: parentOrder.deliveryTo.address.city,
                Label: '{i18n>city}',
            },
            {
                $Type: 'UI.DataField',
                Value: parentOrder.deliveryTo.address.postCode,
            },
            {
                $Type: 'UI.DataField',
                Value: parentOrder.deliveryTo.address.street,
            },
            {
                $Type: 'UI.DataField',
                Value: parentOrder.deliveryTo.address.building,
            },
            {
                $Type: 'UI.DataField',
                Value: parentOrder.notes,
                Label: '{i18n>orderRequestorNotes}',
            },
        ],
    },
    UI.Chart #radialChart    : {
        Title            : '{i18n>progressIndicator}',
        ChartType        : #Donut,
        Measures         : [progress, ],
        MeasureAttributes: [{
            $Type    : 'UI.ChartMeasureAttributeType',
            Measure  : progress,
            Role     : #Axis1,
            DataPoint: '@UI.DataPoint#radialChart',
        }, ],
    },
    UI.DataPoint #radialChart: {
        Value      : progress,
        TargetValue: 100,
        Criticality: status.criticalityCode,
    },
);

annotate service.DeliveryForecasts with @(
    UI.DataPoint #residualPercentage: {
        $Type      : 'UI.DataPointType',
        Value      : residualPercentage,
        Title      : '{i18n>deliveryForecastResiduals}',
        Criticality: {$edmJson: {$If: [
            {$Eq: [
                {$Path: 'isCritical'},
                true
            ]},
            1,
            3
        ]}},
    },
    UI.DataPoint #daysCounter       : {
        $Type      : 'UI.DataPointType',
        Value      : daysCounter,
        Title      : '{i18n>deliveryForecastDaysCounter}',
        Criticality: {$edmJson: {$If: [
            {$Eq: [
                {$Path: 'isCritical'},
                true
            ]},
            1,
            3
        ]}},
    },
);


annotate AppService.OrderStatuses with @(UI.DataPoint #name: {
    $Type      : 'UI.DataPointType',
    Value      : name,
    Title      : '{i18n>status}',
    Criticality: criticalityCode,
});


annotate AppService.WarehouseOrderItems with @(UI.LineItem #WhOrderItems: [
    {
        $Type: 'UI.DataField',
        Value: item.product.supplierCatNo,
    },
    {
        $Type                 : 'UI.DataField',
        Value                 : item.product.title,
        ![@HTML5.CssDefaults] : {width: 'auto'}
    },
    {
        $Type: 'UI.DataField',
        Value: qty,
    },
    {
        $Type: 'UI.DataField',
        Value: item.product.supplier.name,
    },
    {
        $Type      : 'UI.DataField',
        Value      : status.name,
        Criticality: status.criticalityCode,
    },
]);

annotate AppService.WarehouseContacts with @(
    Communication.Contact : {
        $Type: 'Communication.ContactType',
        org  : warehouse.name,
        email: [{
            $Type  : 'Communication.EmailAddressType',
            type   : #work,
            address: email,
        }, ],
        fn   : fullName,
        role : title,
        tel  : [{
            $Type: 'Communication.PhoneNumberType',
            type : #work,
            uri  : tel,
        }, ],
        adr  : [{
            $Type   : 'Communication.AddressType',
            type    : #work,
            street  : warehouse.address.street,
            locality: warehouse.address.city,
            region  : warehouse.address.region.name,
            code    : warehouse.address.postCode,
            country : warehouse.address.region.country.name,
        }, ],
        photo: photoUrl,
    },
    Common.IsNaturalPerson: true
);
