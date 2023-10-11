using db from '../db/schema';

@path: '/app'
service AppService {
    entity Contacts as projection on db.Contacts;
    entity Factories as projection on db.Factories;
    entity FactoriesDepartments as projection on db.FactoriesDepartments;
    entity Orders as projection on db.Orders;
    entity Products as projection on db.Products;
    entity Manufacturies as projection on db.Manufacturies;
    entity Categories as projection on db.Categories;
    entity WarehousesProducts as projection on db.WarehousesProducts;
    entity Warehouses as projection on db.Warehouses;
}