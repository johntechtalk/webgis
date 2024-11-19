/** @odoo-module **/

import { Component, useState, onMounted } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

class GisDraw extends Component {
    static template = "webgis.draw";  // 模板 ID
    setup() {
        this.state = useState({ drawType: "Point" }); // 默认绘制类型为 Point
        this.actionService = useService("action");

        // 地图初始化和绘制交互
        onMounted(() => {
            const id = document.getElementById("map");
            this.map = new ol.Map({
                layers: [
                    new ol.layer.Tile({
                        source: new ol.source.XYZ({
                            url: "http://webst0{1-4}.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}",
                        }),
                    }),
                ],
                target: id,
                view: new ol.View({
                    center: ol.proj.fromLonLat([116.3912757, 39.906217]),
                    zoom: 16,
                }),
            });

            // 创建矢量图层
            this.vectorSource = new ol.source.Vector();
            const vectorLayer = new ol.layer.Vector({
                source: this.vectorSource,
                style: new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: "#ff0000",
                        width: 2,
                    }),
                }),
            });
            this.map.addLayer(vectorLayer);

            // 初次添加默认的绘制交互
            this.addDrawInteraction(this.state.drawType);
        });
    }

    // 根据选择的类型添加绘制交互
    addDrawInteraction(type) {
        if (this.draw) {
            this.map.removeInteraction(this.draw); // 移除之前的绘制交互
        }

        this.draw = new ol.interaction.Draw({
            source: this.vectorSource,
            type: type,
        });

        // 监听绘制结束事件
        this.draw.on("drawend", (event) => {
            const feature = event.feature;
            const geometry = feature.getGeometry();
            let coordinates;
            let coordinateData;
            console.log(geometry.getCoordinates())

            if (type === "Point") {
                // 如果是 Point 类型，获取单个坐标并格式化为 "经度;纬度"
                coordinates = geometry.getCoordinates();
                const [longitude, latitude] = ol.proj.toLonLat(coordinates); // 转换为经纬度
                coordinateData = `${longitude};${latitude}`;
                console.log("经度；纬度：", coordinateData);
            } else if (type === "LineString") {
                // 如果是 LineString 类型，获取坐标数组并格式化为 "经度,纬度;经度,纬度..."
                coordinates = geometry.getCoordinates();
                coordinateData = coordinates
                    .map((coord, index) => {
                        try {
                            const [longitude, latitude] = ol.proj.toLonLat(coord); // 转换为经纬度
                            if (isNaN(longitude) || isNaN(latitude)) {
                                throw new Error("无效的坐标点");
                            }
                            return `${longitude},${latitude}`;
                        } catch (error) {
                            console.error(`坐标点转换失败: ${coord}`, error);
                            return null;
                        }
                    })
                    .filter((coord) => coord !== null) // 过滤掉无效的坐标
                    .join(";");  // 使用分号连接每个点的经纬度
                console.log(`LineString 的经纬度坐标：`, coordinateData);
            } else if (type === "Polygon") {
                // 如果是 Polygon 类型，获取坐标数组并格式化为 "经度,纬度;经度,纬度..."
                coordinates = geometry.getCoordinates();
                const outerRing = coordinates[0]; // 外环
                const innerRings = coordinates.slice(1); // 内环

                // 处理外环
                let outerCoordinates = outerRing
                    .map((coord) => {
                        const [longitude, latitude] = ol.proj.toLonLat(coord); // 转换为经纬度
                        if (isNaN(longitude) || isNaN(latitude)) {
                            throw new Error("无效的坐标点");
                        }
                        return `${longitude},${latitude}`;
                    })
                    .join(";");

                // 处理内环
                let innerCoordinates = innerRings
                    .map((innerRing) => {
                        return innerRing
                            .map((coord) => {
                                const [longitude, latitude] = ol.proj.toLonLat(coord); // 转换为经纬度
                                if (isNaN(longitude) || isNaN(latitude)) {
                                    throw new Error("无效的坐标点");
                                }
                                return `${longitude},${latitude}`;
                            })
                            .join(";");
                    })
                    .join("|"); // 内环用 '|' 分隔

                coordinateData = outerCoordinates;
                if (innerCoordinates) {
                    coordinateData += `|${innerCoordinates}`; // 如果有内环，追加内环的坐标
                }

                console.log(`Polygon 的经纬度坐标：`, coordinateData);
            }

            // 显示弹窗表单并传递经纬度数据
            this.actionService.doAction({
                type: "ir.actions.act_window",
                res_model: "webgis.webgis", // 替换为您的模型名称
                view_mode: "form",
                views: [[false, "form"]],
                target: "new",
                context: {
                    default_longlat: coordinateData,
                },
            });
        });

        this.map.addInteraction(this.draw);
    }

    // 当选择的绘制类型改变时触发
    onTypeChange(event) {
        this.state.drawType = event.target.value; // 更新状态中的绘制类型
        this.addDrawInteraction(this.state.drawType); // 更新绘制交互
    }
}

// 注册组件
registry.category("actions").add("webgis.draw", GisDraw);
export default GisDraw;
