import React from "react";
import {Drawer, Table, message, Typography, Switch, Divider} from "antd";
import dayjs from "dayjs";
import { Chart, Line, Slider, Legend, Tooltip } from "bizcharts";
import duration from "dayjs/plugin/duration"
import axios from "axios";
import PropTypes from "prop-types";

dayjs.extend(duration)

const { Title, Text } = Typography;

const scale = {
    income: {
        alias: '流水'
    },
    date: {
        type: 'time',
        formatter: time => dayjs(time).format('YY-MM-DD')
    }
};

class IncomeDrawer extends React.Component {
    state = {
        data: [],
        income: [],
        month: [],
        visible: false,
        detail: false,
        average: 0
    }

    static contextTypes = {
        onRef: PropTypes.func,
        encrypt: PropTypes.func
    }

    componentDidMount() {
        this.context.onRef(this, 'income')
    }

    fetchData = () => {
        this.props.changeLoading(true);
        const startDate = "20200928"
        const endDate = dayjs().format("YYYYMMDD")
        const token = this.context.encrypt(startDate + endDate)
        axios.get("https://api.drjchn.com/api/v2/tieba/income", {
            params: {
                token,
                start: startDate,
                end: endDate
            }
        })
            .then(response => {
                this.setState({ visible: true })
                this.props.changeLoading(false);
                const { data, income, average, month } = response.data;
                month.sort((a, b) => dayjs(b.date) - dayjs(a.date))
                this.setState({ data, income, average, month })
            })
            .catch(err => {
                this.props.changeLoading(false);
                if (err.response) {
                    message.error(err.response.data.message);
                }
                else {
                    message.error("获取数据失败")
                }
            })
    }

    solveData = () => {
        const { data, average } = this.state;
        const result = []
        for (let i = 0; i < data.length; i++) {
            data[i].type = '实际收入'
        }

        for (let d of data) {
            result.push(d)
            const avg = {
                date: d.date,
                income: average,
                type: '平均收入'
            }
            result.push(avg)
        }
        return result
    }

    render() {
        const { visible, income, detail, month } = this.state;
        const cols = [
            {
                title: '卡池',
                dataIndex: 'name',
                render: (text, record) => {
                    const days = dayjs.duration(dayjs().diff(dayjs(record.date)))
                    return days.days() > 5 || days.months() > 0 ? text : `${text}(${days.days()}天)`
                }
            },
            {
                title: '日期',
                dataIndex: 'date',
                render: text => dayjs(text).format("YYYY-MM-DD"),
            },
            {
                title: '流水总数',
                dataIndex: 'income',
                render: text => detail ? text : (text / 10000).toFixed(2) + "W",
                sorter: (a, b) => a.income - b.income
            },
            {
                title: '流水峰值',
                dataIndex: 'max',
                render: text => detail ? text : (text / 10000).toFixed(2) + "W",
                sorter: (a, b) => a.max - b.max
            }
        ];

        const columns = [
            {
                title: '月份',
                dataIndex: 'date',
                key: 'date',
                render: text => dayjs(text).format("YYYY-MM")
            },
            {
                title: '流水',
                dataIndex: 'income',
                key: 'income',
                render: text => detail ? text : (text / 10000).toFixed(2) + "W"
            }
        ];

        return (
            <Drawer
                title="流水统计"
                placement="right"
                visible={visible}
                width={window.outerWidth > 520 ? 500 : window.outerWidth}
                onClose={() => {
                    this.setState({ visible: false })
                }}
                style={{ textAlign: 'center' }}
            >
                <Text style={{ marginRight: 10 }}>详细数据</Text>
                <Switch checked={detail} onChange={() => this.setState({ detail: !detail })} />
                <Divider />
                <Title level={4}>历史流水</Title>
                <Chart
                    scale={scale}
                    padding={[0,30,50,80]}
                    autoFit
                    height={300}
                    data={this.solveData()}
                >
                    <Line position="date*income" color="type" />
                    <Slider
                        start={0.5}
                        padding={[0, 0, 0, 0]}
                        formatter={(v) => {
                            return dayjs(v).format("YYYY-MM-DD")
                        }}
                    />
                    <Tooltip shared showCrosshairs />
                    <Legend offsetY={-10} position="top-right" background={{
                        padding:[5,100,5,20],
                        style: {
                            fill: '#eaeaea',
                            stroke: '#fff'
                        }
                    }} />
                </Chart>
                <Divider />
                <Title level={4}>5日流水统计</Title>
                <Table
                    dataSource={income}
                    columns={cols}
                    rowKey="name"
                />
                <Divider />
                <Title level={4}>每月流水统计</Title>
                <Table
                    dataSource={month}
                    columns={columns}
                    rowKey="name"
                />
                <Text type="secondary" style={{ float: "left" }}>*数据来源：蝉大师</Text>
                <br/><br/>
            </Drawer>
        )
    }
}

export default IncomeDrawer;