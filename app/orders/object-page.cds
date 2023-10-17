using AppService as service from '../../srv/app-service';
using from './annotations';

annotate service.Orders with @(
    UI.HeaderInfo         : {
        Title   : {
            $Type: 'UI.DataField',
            Value: title,
        },
        TypeName: 'Order',
    },
    UI.HeaderFacets       : [
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
    ],
    UI.FieldGroup #Contact: {
        $Type: 'UI.FieldGroupType',
        Data : [
            {
                $Type: 'UI.DataField',
                Value: contact.fullName,
            },
            {
                $Type: 'UI.DataField',
                Value: contact.title,
            },
            {
                $Type: 'UI.DataField',
                Value: contact.email,
            },
            {
                $Type: 'UI.DataField',
                Value: contact.tel,
            },
            {
                $Type: 'UI.DataField',
                Label: '{i18n>managerFullName}',
                Value: contact.manager.fullName,
            },
        ],
    }
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
]);

annotate AppService.OrdersItems with @(UI.LineItem #Items: [
    {
        $Type: 'UI.DataField',
        Value: item_product_ID,
        Label: '{i18n>catNo}',
    },
    {
        $Type                   : 'UI.DataField',
        Value                   : item.product.title,
        ![@Common.FieldControl] : #ReadOnly,
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
            Label: 'Delivery Target',
            Value: deliveryTo_ID,
        },
        {
            $Type                   : 'UI.DataField',
            Value                   : deliveryTo.department.name,
            ![@Common.FieldControl] : #ReadOnly,
        },
        {
            $Type                   : 'UI.DataField',
            Label                   : '{i18n>country}',
            Value                   : deliveryTo.region.country.name,
            ![@Common.FieldControl] : #ReadOnly,
        },
        {
            $Type                   : 'UI.DataField',
            Label                   : '{i18n>city}',
            Value                   : deliveryTo.region.name,
            ![@Common.FieldControl] : #ReadOnly,
        },
        {
            $Type                   : 'UI.DataField',
            Value                   : deliveryTo.postCode,
            ![@Common.FieldControl] : #ReadOnly,
        },
        {
            $Type                   : 'UI.DataField',
            Value                   : deliveryTo.street,
            ![@Common.FieldControl] : #ReadOnly,
        },
        {
            $Type                   : 'UI.DataField',
            Value                   : deliveryTo.building,
            ![@Common.FieldControl] : #ReadOnly,
        },
        {
            $Type: 'UI.DataField',
            Value: notes,
        },
    ],
});

annotate service.Orders with {
    notes      @UI.MultiLineText;
    deliveryTo @mandatory;
};

annotate service.Addresses with {
    postCode @UI.HiddenFilter;
    building @UI.HiddenFilter;
    street   @UI.HiddenFilter;
    ID       @UI.Hidden;
    title    @UI.HiddenFilter;
}

annotate service.OrdersItems with {
    item @mandatory;
    qty  @mandatory;
}

annotate service.Warehouses with {
    ID @UI.HiddenFilter;
}

annotate AppService.OrdersItems with @(UI.PresentationVariant #Items: {
    $Type         : 'UI.PresentationVariantType',
    Visualizations: ['@UI.LineItem#Items', ],
    GroupBy       : [item.warehouse.name, ],
});

annotate AppService.Catalogue with {
    productID     @UI.Hidden;
    title         @UI.HiddenFilter;
    description   @UI.HiddenFilter;
    supplierCatNo @UI.HiddenFilter;
    warehouseID   @UI.Hidden;
    warehouseName @UI.HiddenFilter;
}

annotate AppService.Regions with {
    name  @UI.HiddenFilter;
    descr @UI.HiddenFilter;
    code  @UI.HiddenFilter;
};

annotate AppService.OrderStatuses with @(UI.DataPoint #Status: {
    $Type      : 'UI.DataPointType',
    Value      : name,
    Title      : '{i18n>status}',
    Criticality: criticalityCode,
});
