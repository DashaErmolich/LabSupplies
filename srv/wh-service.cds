using db from '../db/schema';

@path    : '/wh'
@requires: 'any'
service WarehouseService {
  entity Contacts            as projection on db.Contacts;
  entity Departments         as projection on db.Departments;
  entity Orders              as projection on db.Orders

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
  entity WarehouseOrders     as projection on db.WarehouseOrders;
  entity WarehouseContacts   as projection on db.WarehouseContacts;
  entity Attachments         as projection on db.Attachments;
  entity WarehouseOrderItems as projection on db.WarehouseOrderItems;
  entity DeliveryForecasts   as projection on db.DeliveryForecasts;
  function collectItem(id : String, userEmail : String) returns Boolean;
  action   updateDelivery();
  event triggerDeliveryUpdate : {}
}
