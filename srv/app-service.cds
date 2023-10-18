using db from '../db/schema';

@path: '/app'
service AppService @(requires: 'authenticated-user') {
    entity Contacts          as projection on db.Contacts;
    entity Departments       as projection on db.Departments;

    @odata.draft.enabled
    entity Orders            as projection on db.Orders;

    entity Products          as projection on db.Products;
    entity Suppliers         as projection on db.Suppliers;
    entity Categories        as projection on db.Categories;
    entity WarehouseProducts as projection on db.WarehouseProducts;
    entity Warehouses        as projection on db.Warehouses;
    entity Addresses         as projection on db.Addresses;
    entity OrderStatuses     as projection on db.OrderStatuses;

    entity OrderItems        as projection on db.OrderItems;

    view Catalogue as
        select from WarehouseProducts as wp
        inner join Products as p
            on wp.product.ID = p.ID
        {
            p.ID                             as productID,
            p.title                          as title,
            p.description                    as description,
            p.supplierCatNo                  as supplierCatNo,
            p.supplier.name                  as supplier,
            p.category                       as category,
            wp.stock                         as stock,
            wp.warehouse.ID                  as warehouseID,
            wp.warehouse.name                as warehouseName,
            wp.warehouse.region.country.code as warehouseCountryCode,
            wp.warehouse.region.code         as warehouseRegionCode,
        }
        where
            wp.stock <> 0;
}

@path: '/admin'
service AdminService {
    entity Contacts          as projection on db.Contacts;
    entity Departments       as projection on db.Departments;
    entity Orders            as projection on db.Orders;
    entity Products          as projection on db.Products;
    entity Suppliers         as projection on db.Suppliers;
    entity Categories        as projection on db.Categories;
    entity WarehouseProducts as projection on db.WarehouseProducts;
    entity Warehouses        as projection on db.Warehouses;
    entity Addresses         as projection on db.Addresses;
}
