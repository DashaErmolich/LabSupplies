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

annotate service.Orders with {
    notes      @UI.MultiLineText;
    deliveryTo @mandatory;
};

annotate service.Addresses with {
    postCode @UI.HiddenFilter;
    building @UI.HiddenFilter;
    street   @UI.HiddenFilter;
    ID       @UI.Hidden;
}

annotate service.OrderItems with {
    item @mandatory;
    qty  @mandatory;
}

annotate service.Warehouses with {
    ID @UI.HiddenFilter;
}

annotate AppService.OrderItems with @(UI.PresentationVariant #Items: {
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
    name          @UI.HiddenFilter;
}

annotate AppService.DeliveryTargets with {
    departmentID @UI.Hidden;
    name         @UI.HiddenFilter;
    countryName  @UI.HiddenFilter;
    regionName   @UI.HiddenFilter;
}

annotate AppService.OrderStatuses with @(UI.DataPoint #Status: {
    $Type      : 'UI.DataPointType',
    Value      : name,
    Title      : '{i18n>status}',
    Criticality: criticalityCode,
});

annotate AppService.Orders with @(UI.Identification: [
    {
        $Type             : 'UI.DataFieldForAction',
        Action            : 'AppService.approveOrder',
        Label             : '{i18n>approveOrder}',
        Criticality       : 3,
        ![@UI.Hidden]     : isNotActionable,
        ![@UI.Importance] : #High,
    },
    {
        $Type             : 'UI.DataFieldForAction',
        Action            : 'AppService.rejectOrder',
        Label             : '{i18n>rejectOrder}',
        Criticality       : 1,
        ![@UI.Hidden]     : isNotActionable,
        ![@UI.Importance] : #High,
    },
]);

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

annotate service.Attachments with {
    content   @mandatory;
    notes     @UI.MultiLineText;
    fileName  @UI.Hidden;
    ID        @UI.Hidden;
    mediaType @UI.Hidden;
    order     @UI.Hidden;
};

// WH ORDERS

annotate AppService.WarehouseOrders with @(
    UI.HeaderInfo           : {Title: {
        $Type: 'UI.DataField',
        Value: title,
    }, },

    UI.HeaderFacets         : [
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
    ],

    UI.Facets               : [{
        $Type : 'UI.ReferenceFacet',
        Label : 'items',
        ID    : 'WhOrderItems',
        Target: 'items/@UI.LineItem#WhOrderItems',
    }],
    UI.FieldGroup #WhContact: {
        $Type: 'UI.FieldGroupType',
        Data : [{
            $Type : 'UI.DataFieldForAnnotation',
            Target: 'processor/@Communication.Contact',
            Label : '{i18n>processedBy}',
        }, ],
    }
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
        $Type: 'UI.DataField',
        Value: item.product.title,
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
