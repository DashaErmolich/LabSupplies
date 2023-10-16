using db from '../db/schema';

@path: '/app'
service AppService {
    entity Contacts           as projection on db.Contacts;
    entity Departments        as projection on db.Departments;

    @odata.draft.enabled
    entity Orders             as projection on db.Orders;

    entity Products           as projection on db.Products;
    entity Suppliers          as projection on db.Suppliers;
    entity Categories         as projection on db.Categories;
    entity WarehousesProducts as projection on db.WarehousesProducts;
    entity Warehouses         as projection on db.Warehouses;
    entity Addresses          as projection on db.Addresses;

    view Catalogue as
        select from WarehousesProducts as wp
        inner join Products as p
            on wp.product.ID = p.ID
        {
            p.ID                             as productID     @UI.Hidden,
            p.title                          as title         @UI.HiddenFilter,
            p.description                    as description   @UI.HiddenFilter,
            p.supplierCatNo                  as supplierCatNo @UI.HiddenFilter,
            p.supplier.name                  as supplier,
            p.category                       as category,
            wp.stock                         as stock,
            wp.warehouse.ID                  as warehouseID   @UI.Hidden,
            wp.warehouse.name                as warehouseName @UI.HiddenFilter,
            wp.warehouse.region.country.code as warehouseCountryCode,
            wp.warehouse.region.code         as warehouseRegionCode,
        }
}

@path: '/admin'
service AdminService {
    entity Contacts           as projection on db.Contacts;
    entity Departments        as projection on db.Departments;
    entity Orders             as projection on db.Orders;
    entity Products           as projection on db.Products;
    entity Suppliers          as projection on db.Suppliers;
    entity Categories         as projection on db.Categories;
    entity WarehousesProducts as projection on db.WarehousesProducts;
    entity Warehouses         as projection on db.Warehouses;
    entity Addresses          as projection on db.Addresses;
}
