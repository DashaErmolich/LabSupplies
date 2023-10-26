using from './labels';
using from './list-report';
using from './object-page';
using from './headers';
using from './capabilities';
using AppService as service from '../../srv/app-service';


annotate service.Orders with {
  status                 @UI.Hidden;
  processor              @UI.Hidden;
  notes                  @UI.MultiLineText;
  isNotActionable        @UI.Hidden;
  isNotApprovable        @UI.Hidden;
  isNotEditable          @UI.Hidden;
  isNotRejectable        @UI.Hidden;
  isRelatedOrdersVisible @UI.Hidden;
};

annotate service.OrderItems with {
  ID       @UI.Hidden;
}

annotate service.WarehouseOrderItems with {
  item     @UI.Hidden;
  content  @UI.Hidden;
  order    @UI.Hidden;
  status   @UI.Hidden;
  ID       @UI.Hidden;
  fileName @UI.Hidden;
}

annotate service.Attachments with {
  notes     @UI.MultiLineText;
  fileName  @UI.Hidden;
  ID        @UI.Hidden;
  mediaType @UI.Hidden;
  order     @UI.Hidden;
};

annotate service.Catalogue with {
  productID     @UI.Hidden;
  title         @UI.HiddenFilter;
  description   @UI.HiddenFilter;
  supplierCatNo @UI.HiddenFilter;
  warehouseID   @UI.Hidden;
  name          @UI.HiddenFilter;
}

annotate service.DeliveryTargets with {
  departmentID @UI.Hidden;
  name         @UI.HiddenFilter;
  countryName  @UI.HiddenFilter;
  regionName   @UI.HiddenFilter;
}

annotate service.Addresses with {
  postCode @UI.HiddenFilter;
  building @UI.HiddenFilter;
  street   @UI.HiddenFilter;
  ID       @UI.Hidden;
}

annotate service.Warehouses with {
  ID @UI.HiddenFilter;
}