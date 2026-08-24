from odoo import fields, models


class ProductPublishWizard(models.TransientModel):
    _name = 'product.publish.wizard'
    _description = 'Product Publish/Unpublish'

    state = fields.Selection(
        selection=[('publish', 'Publish'), ('unpublish', 'Unpublish')],
        string='Website',
        required=True,
        default='unpublish',
    )

    def publishing_state(self):
        self.ensure_one()
        products = self.env['product.template'].browse(self.env.context.get('active_ids', [])).exists()
        if products:
            products.write({'website_published': self.state == 'publish'})
        return {'type': 'ir.actions.act_window_close'}
