using AppService as service from '../../srv/app-service';
using from './annotations';

annotate service.Orders with @(
    UI.HeaderInfo : {
        Title : {
            $Type : 'UI.DataField',
            Value : title,
        },
        TypeName : 'hvdslbf',
        TypeNamePlural : '',
    },
    UI.HeaderFacets : [
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'Contact',
            Target : '@UI.FieldGroup#Contact',
        },
    ],
    UI.FieldGroup #Contact : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : contact.fullName,
            },{
                $Type : 'UI.DataField',
                Value : contact.title,
            },{
                $Type : 'UI.DataField',
                Value : contact.email,
            },{
                $Type : 'UI.DataField',
                Value : contact.tel,
            },{
                $Type : 'UI.DataField',
                Label : '{i18n>managerFullName}',
                Value : contact.manager.fullName,
            },],
    }
);

annotate service.Orders with @(
    UI.Facets : [
{
            $Type : 'UI.ReferenceFacet',
            ID : 'Items',
            Target : 'items/@UI.LineItem#Items',
            Label : '{i18n>productsInfo}',
        },
        {
            $Type : 'UI.ReferenceFacet',
            ID : 'Delivery',
            Target : '@UI.FieldGroup#Delivery',
            Label : '{i18n>deliveryInfo}'
        },
    ]
);

annotate service.OrdersItems with @(
    UI.LineItem #Items : [
        {
            $Type : 'UI.DataField',
            Value : item.product.supplierCatNo,
        },{
            $Type : 'UI.DataField',
            Value : item.product.supplier.name,
        },{
            $Type : 'UI.DataField',
            Value : item.product.title,
        },{
            $Type : 'UI.DataField',
            Value : qty,
        },]
);


annotate service.Orders with @(
    UI.FieldGroup #Delivery : {
        $Type : 'UI.FieldGroupType',
        Data : [
            {
                $Type : 'UI.DataField',
                Value : deliveryTo.postCode,
            },
            {
                $Type : 'UI.DataField',
                Value : deliveryTo.street,
            },
            {
                $Type : 'UI.DataField',
                Value : deliveryTo.region.name,
            },
            {
                $Type : 'UI.DataField',
                Value : deliveryTo.region.descr,
            },
            {
                $Type : 'UI.DataField',
                Value : contact.email,
            },
            {
                $Type : 'UI.DataField',
                Value : deliveryTo.department.name,
            },
            {
                $Type : 'UI.DataField',
                Value : deliveryTo.region_country_code,
            },
        ],
    }
);

