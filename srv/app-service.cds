using db from '../db/schema';

@path: '/app'
service AppService @(requires: 'Manager') {
    entity Contacts            as projection on db.Contacts;
    entity Departments         as projection on db.Departments;

    @odata.draft.enabled
    entity Orders              as projection on db.Orders actions {

        @(
            cds.odata.bindingparameter.name: '_it',
            Common.SideEffects             : {TargetEntities: ['_it']},
            Common.IsActionCritical        : true
        )
        action approveOrder();

        @(
            cds.odata.bindingparameter.name: '_it',
            Common.SideEffects             : {TargetEntities: ['_it']}
        )
        action rejectOrder(
                           @(Common:{
                               Text                    : status.name,
                               TextArrangement         : #TextOnly,
                               ValueListWithFixedValues: true,
                               Label                   : '{i18n>orderStatus}',
                               ValueListMapping        : {
                                   Parameters    : [
                                       {
                                           $Type            : 'Common.ValueListParameterDisplayOnly',
                                           ValueListProperty: 'name',
                                       },
                                       {
                                           $Type            : 'Common.ValueListParameterOut',
                                           ValueListProperty: 'ID',
                                           LocalDataProperty: statusID,
                                       },
                                   ],
                                   CollectionPath: 'RejectStatuses',
                               }
                           })
                           statusID : String @mandatory,
                           notes : String);
    }

    @readonly
    entity Products            as projection on db.Products;

    @readonly
    entity Suppliers           as projection on db.Suppliers;

    @readonly
    entity Categories          as projection on db.Categories;

    @readonly
    entity WarehouseProducts   as projection on db.WarehouseProducts;

    @readonly
    entity Warehouses          as projection on db.Warehouses;

    @readonly
    entity Addresses           as projection on db.Addresses;

    @readonly
    entity OrderStatuses       as projection on db.OrderStatuses;

    entity OrderItems          as projection on db.OrderItems;

    view Catalogue as
        select from WarehouseProducts as wp
        inner join Products as p
            on wp.product.ID = p.ID
        {
            p.ID                                     as productID,
            p.title                                  as title,
            p.description                            as description,
            p.supplierCatNo                          as supplierCatNo,
            p.supplier.name                          as supplier,
            p.category                               as category,
            wp.stock                                 as stock,
            wp.warehouse.ID                          as warehouseID,
            wp.warehouse.name                        as name,
            wp.warehouse.address.region.country.code as warehouseCountryCode,
            wp.warehouse.address.region.code         as warehouseRegionCode,
        }
        where
            wp.stock <> 0;

    view RejectStatuses as
        select from OrderStatuses as os
        where
               os.ID = 'WAITING_FOR_EDIT'
            or os.ID = 'REJECTED';

    entity WarehouseOrders     as projection on db.WarehouseOrders;

    view DeliveryTargets as
        select from Departments as d
        inner join Addresses as a
            on d.address.ID = a.ID
        {
            d.ID                  as departmentID,
            d.name                as name,
            a.region.code         as regionCode,
            a.region.name         as regionName,
            a.region.country.code as countryCode,
            a.region.country.name as countryName,
        }
        where
            d.name <> 'Supplies';

    entity WarehouseContacts   as projection on db.WarehouseContacts;
    entity Attachments         as projection on db.Attachments;
    entity WarehouseOrderItems as projection on db.WarehouseOrderItems;
}

@path: '/admin'
service AdminService {
    //entity Contacts          as projection on db.Contacts;
    //entity Departments       as projection on db.Departments;
    entity Orders              as projection on db.Orders;
    entity Products            as projection on db.Products;
    entity Suppliers           as projection on db.Suppliers;
    entity Categories          as projection on db.Categories;
    entity WarehouseProducts   as projection on db.WarehouseProducts;
    //entity Warehouses        as projection on db.Warehouses;
    entity Addresses           as projection on db.Addresses;
    entity OrderStatuses       as projection on db.OrderStatuses;
    entity OrderItems          as projection on db.OrderItems;
    //entity Organisation as projection on db.Organisation;
    entity Attachments         as projection on db.Attachments;
}
