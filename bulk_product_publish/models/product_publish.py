from odoo import models


class ProductTemplate(models.Model):
    _inherit = 'product.template'

    def product_publish(self):
        context = dict(self.env.context, active_ids=self.ids, active_model=self._name)
        return {
            'name': 'Publish/Unpublish Product',
            'view_mode': 'form',
            'res_model': 'product.publish.wizard',
            'view_id': self.env.ref('bulk_product_publish.product_publish_wizard_view_form').id,
            'type': 'ir.actions.act_window',
            'context': context,
            'target': 'new',
        }
