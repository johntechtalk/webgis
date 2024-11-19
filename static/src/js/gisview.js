/** @odoo-module **/

import { Component, useState, onMounted } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { CheckBox } from "@web/core/checkbox/checkbox";
import { Dropdown } from "@web/core/dropdown/dropdown";
import { DropdownItem } from "@web/core/dropdown/dropdown_item";
import { Notebook } from "@web/core/notebook/notebook";
import { useService } from "@web/core/utils/hooks";

class Mapview extends Component {
    static template = "webgis.AwesomeDashboard";
    static components = { CheckBox, Dropdown, DropdownItem, Notebook };
    setup() {
        this.state = useState({ mapData: [], style: [] });
        this.orm = useService("orm");
        this.vectorSource;

        onMounted(() => {
            this.initializeMap();
            this.loadfenlei();
        });
    }

    // 加载分类数据
    async loadfenlei() {
        try {
            const data = await this.orm.call('webgis.mystyle', 'get_style_data', ['id',]);
            this.state.style = data;

        } catch (error) {
            console.log(error);
        }
    }

    // 初始化地图
    initializeMap() {
        const id = document.getElementById('map');

        // 创建 Popup overlay
        this.popup = new ol.Overlay({
            element: document.getElementById('popup'),
            autoPan: true,
            autoPanAnimation: { duration: 250 },
        });

        this.map = new ol.Map({
            layers: [
                new ol.layer.Tile({
                    source: new ol.source.XYZ({ url: 'http://webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}' })
                }),
                new ol.layer.Vector({
                    source: new ol.source.Vector()
                })
            ],
            target: id,
            overlays: [this.popup],
            view: new ol.View({
                center: ol.proj.fromLonLat([116.3912757, 39.906217]),
                zoom: 16
            })
        });

        // 获取 Popup 元素并绑定关闭事件
        const popupCloser = document.getElementById('popup-closer');
        popupCloser.onclick = () => {
            this.popup.setPosition(undefined);
            popupCloser.blur();
            return false;
        };

        // 为地图添加点击事件
        this.map.on('singleclick', (event) => {
            this.map.forEachFeatureAtPixel(event.pixel, (feature) => {
                const coordinates = event.coordinate;
                const { name, style, xiangqing, description } = feature.getProperties();
                // 设置弹窗内容
                // document.getElementById('popup-content').innerHTML = `<div style="background-color: white;"><strong>名称:</strong> ${name}<br><strong>样式:</strong> ${style.name}<br><strong>详情:</strong>${xiangqing}</div>`;
                document.getElementById('popup-content').innerHTML = description;
                // 显示弹窗
                this.popup.setPosition(coordinates);
            });
        });
    }



    // 获取后台数据
    async fetchMapData(e) {
        try {
            
            const value = e.target.checked;
            const style_id = e.target.id;
            if (value === true){
                const result = await this.orm.call('webgis.webgis', 'get_map_data', [style_id,]);
                this.state.mapData = result; // 更新状态
                this.updateMap(result); // 更新地图显示
            }else {

                const features=this.vectorSource.getFeatures();

                features.forEach((feature) =>  {
                    // 检查要素的样式属性
                    var style = feature.values_.style;
                    // this.vectorSource.removeFeature(feature);
                    console.log(style);
                    console.log(parseInt(style_id));
                    if (style === parseInt(style_id)) {
                        // 如果样式值为3，销毁该要素
                        this.vectorSource.removeFeature(feature);
                    }
                });
            }
               
            
        } catch (error) {
            console.error('Error fetching map data:', error);
        }
    }

    // 色彩进制转换
    hexToRgba(hex, opacity = 1) {
        // 去掉 '#' 如果有的话
        hex = hex.replace('#', '');
        
        // 解析十六进制颜色
        let r = parseInt(hex.substring(0, 2), 16);
        let g = parseInt(hex.substring(2, 4), 16);
        let b = parseInt(hex.substring(4, 6), 16);
        
        // 返回 rgba 格式，透明度默认为 1
        return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    
  
    
    // 用获得的数据更新地图
    updateMap(data) {
        this.vectorSource = this.map.getLayers().getArray()[1].getSource();
        // vectorSource.clear();

        try {
            const dataArray = JSON.parse(data);
            dataArray.forEach((item) => {
                const { id, name, type, longlat, style, xiangqing, description } = item;
                console.log(item);
                let geometry;
                if (type === "Point") {
                    geometry = new ol.geom.Point(ol.proj.fromLonLat(longlat));
                } else if (type === "LineString") {
                    const lineCoords = longlat.map(coord => ol.proj.fromLonLat(coord));
                    geometry = new ol.geom.LineString(lineCoords);
                } else if (type === "Polygon") {
                    const polygonCoords = [longlat.map(coord => ol.proj.fromLonLat(coord))];
                    geometry = new ol.geom.Polygon(polygonCoords);
                }

                const featureStyle = new ol.style.Style({
                    image: type === "Point" ? new ol.style.Icon({
                        src: style.url,
                        scale: style.scale,
                        opacity: style.opacity,
                        offsetY: style.offset_y,
                    }) : null,
                    stroke: type !== "Point" ? new ol.style.Stroke({
                        color: style.line_color,
                        width: style.line_width,
                    }) : null,
                    fill: type === "Polygon" ? new ol.style.Fill({
                        // color: style.line_stroke_color,
                        // opacity: style.opacity,
                        // color: 'rgba(0, 255, 0, 0.5)',
                        color: this.hexToRgba(style.line_stroke_color,style.opacity),
                    }) : null,
                    text: new ol.style.Text({
                        text: name,
                        font: style.font,
                        fill: new ol.style.Fill({ color: style.text_fill_color }),
                        stroke: new ol.style.Stroke({ color: style.text_stroke_color }),
                        textAlign: style.text_align,
                        textBaseline: style.text_baseline,
                    }),
                });

                const feature = new ol.Feature({
                    geometry: geometry,
                    name: name,
                    xiangqing: xiangqing,
                    description: description,
                    style: style.id  // 保存样式信息以便弹窗显示
                });
                feature.setStyle(featureStyle);

                this.vectorSource.addFeature(feature);
            });
        } catch (error) {
            console.error("JSON 解析失败:", error.message);
        }
    }

}

// 注册组件
registry.category("actions").add("webgis.mapview", Mapview);