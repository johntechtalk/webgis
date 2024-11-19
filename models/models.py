# -*- coding: utf-8 -*-

from odoo import models, fields, api
import json



# 样式
class myStyle(models.Model):
    _name='webgis.mystyle'
    _description='样式'

    name=fields.Char(string='样式名称')
    category=fields.Selection(selection=[('Point','点'),('LineString','线'),('Polygon','面')],string='几何类型')
    icon_url = fields.Image(string='图标地址', attachment=True)
    opacity = fields.Float(string='透明度', default=1.0)
    scale = fields.Float(string='大小', default=1.0)
    text_fill_color = fields.Char(string='文本填充颜色', default='#000000')
    text_stroke_color = fields.Char(string='文本边缘颜色', default='#FFFFFF')
    line_color = fields.Char(string='线条颜色', default='#000000')
    line_stroke_color = fields.Char(string='线条边缘颜色', default='#000000')
    line_width = fields.Float(string='线条宽度', default=3)
    font = fields.Char(string='字体', default='normal 14px 微软雅黑')
    text_align = fields.Char(string='文本位置', default='center')
    text_baseline = fields.Char(string='文本基准线', default='top')
    offset_y = fields.Integer(string='上下偏移', default=-20)

    # 获取所有分类到前台做
    def get_style_data(self):
        data=self.search([])
        ls=[]
        for record in data:
            tdic={}
            tdic['id']=record.id
            tdic['name']=record.name
            tdic['value']=False
            ls.append(tdic)
        return ls


# 数据
class webgis(models.Model):
    _name = 'webgis.webgis'
    _description = '数据'

    name = fields.Char(string='标题')
    xiangqing = fields.Text(string='详细')
    longlat=fields.Text(string='经纬度')
    style=fields.Many2one('webgis.mystyle',string='样式')
    type=fields.Selection(string='类型',related='style.category',store=True)
    description=fields.Html(string='描述')


    @api.model
    def get_map_data(self,style_id):
        records=self.search([('style','=',int(style_id))])
        data = []
        for record in records:
            # 出来坐标
            lx=record.type
            if lx == 'Point':
                zb=record.longlat.split(';')
                long=float(zb[0])
                lat=float(zb[1])
                jg=[long,lat]
            if lx == 'LineString' or lx == 'Polygon':
                zbs=record.longlat.split(';')
                jg=[]
                for zb in zbs:
                    jwd=zb.split(',')
                    
                    long=float(jwd[0])
                    lat=float(jwd[1])
                    coodin=[long,lat]
                    # print(coodin)
                    jg.append(coodin)

            # 处理style
            style=record.style
            style_dict=style.search_read([('id','=',style.id)],fields=['name','category','opacity',
                                                    'scale','text_fill_color','text_stroke_color',
                                                    'line_color','line_stroke_color','line_width',
                                                    'font','text_align','text_baseline','offset_y'])[0]
            style_dict['url']=f"/web/image/{style[0]._name}/{style[0].id}/icon_url"
            

           
            data.append({
                'id': record.id,
                'name': record.name,
                'type': record.type,
                'xiangqing': record.xiangqing,
                'longlat': jg,
                'style':style_dict,
                'description':record.description
            })

        return json.dumps(data)






