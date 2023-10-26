using AppService from '../../srv/app-service.cds';

annotate AppService.Orders with @(
    Capabilities.DeleteRestrictions : {
        Deletable : false,
    },
    UI.UpdateHidden : isNotEditable,
);