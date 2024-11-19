# -*- coding: utf-8 -*-
{
    'name': "地理信息系统",

    'summary': "地理信息系统",

    'description': """
地理信息系统
    """,

    'author': "My Company",
    'website': "https://www.yourcompany.com",

    # Categories can be used to filter modules in modules listing
    # Check https://github.com/odoo/odoo/blob/15.0/odoo/addons/base/data/ir_module_category_data.xml
    # for the full list
    'category': 'webgis',
    'version': '0.1',

    # any module necessary for this one to work correctly
    'depends': ['base','web','mail'],

    # always loaded
    'data': [
        'security/ir.model.access.csv',
        'views/views.xml',
        'views/style.xml',
        'views/gis.xml',
    ],
    # only loaded in demonstration mode
    'demo': [
        'demo/demo.xml',
    ],
    'application': True,
    'assets': {
        'web.assets_backend': [
            'webgis/static/src/js/*.js',
            'webgis/static/src/xml/*.xml',
            'webgis/static/src/css/*.css',
        ],
    },
}

