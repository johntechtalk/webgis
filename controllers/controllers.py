# -*- coding: utf-8 -*-
# from odoo import http


# class Webgis(http.Controller):
#     @http.route('/webgis/webgis', auth='public')
#     def index(self, **kw):
#         return "Hello, world"

#     @http.route('/webgis/webgis/objects', auth='public')
#     def list(self, **kw):
#         return http.request.render('webgis.listing', {
#             'root': '/webgis/webgis',
#             'objects': http.request.env['webgis.webgis'].search([]),
#         })

#     @http.route('/webgis/webgis/objects/<model("webgis.webgis"):obj>', auth='public')
#     def object(self, obj, **kw):
#         return http.request.render('webgis.object', {
#             'object': obj
#         })

