using AppService as service from '../../srv/app-service';
using from '../../db/schema';

annotate service.Orders with @(
    UI.LineItem : [
        {
            $Type : 'UI.DataField',
            Value : createdAt,
        },{
            $Type : 'UI.DataField',
            Value : contact.email,
            Label : 'email',
        },{
            $Type : 'UI.DataField',
            Value : contact.title,
            Label : 'title',
        },{
            $Type : 'UI.DataField',
            Value : deliveryTo.department.name,
            Label : 'name',
        },]
);
annotate service.Orders with @(
    UI.FieldGroup #GeneratedGroup1 : {
        $Type : 'UI.FieldGroupType',
        Data : [
        ],
    },
    UI.Facets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'GeneratedFacet1',
            Label : 'General Information',
            Target : '@UI.FieldGroup#GeneratedGroup1',
        },
        {
            $Type : 'UI.ReferenceFacet',
            Label : 'Items',
            ID : 'Items',
            Target : 'items/@UI.LineItem#Items',
        },
    ]
);
annotate service.OrdersItems with @(
    UI.LineItem #Items : [
        {
            $Type : 'UI.DataField',
            Value : item.product.manufacturerCatNo,
            Label : 'manufacturerCatNo',
        },{
            $Type : 'UI.DataField',
            Value : item.product.title,
            Label : 'title',
        },{
            $Type : 'UI.DataField',
            Value : item.product.manufacturer.name,
            Label : 'name',
        },{
            $Type : 'UI.DataField',
            Value : qty,
            Label : 'qty',
        },]
);
