using AppService from '../../srv/app-service.cds';

annotate AppService.OrderItems with @(
  UI.HeaderInfo : {
    TypeName : 'Product',
    TypeNamePlural : 'Products',
  }
);

annotate AppService.Attachments with @(
  UI.HeaderInfo : {
    TypeName : 'File',
    TypeNamePlural : 'Files',
  }
);

annotate AppService.WarehouseOrderItems with @(
  UI.HeaderInfo : {
    TypeName : 'Product',
    TypeNamePlural : 'Products',
  }
);