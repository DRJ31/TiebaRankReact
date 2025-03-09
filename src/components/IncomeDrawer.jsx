import React, { useEffect, useRef, useState } from "react";
import { Divider, Drawer, message, Switch, Table, Typography } from "antd";
import dayjs from "dayjs";
import { Chart, Interval, Legend, Line, Slider, Tooltip } from "bizcharts";
import duration from "dayjs/plugin/duration"
import axios from "axios";
import encrypt from "../encrypt";

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

const incomeScale = {
    income: {
        alias: '流水'
    },
    date: {
        formatter: time => dayjs(time).format('YY-MM')
    }
};

const IncomeDrawer = (props) => {
    // States
    const [data, setData] = useState([]);
    const [income, setIncome] = useState([]);
    const [month, setMonth] = useState([]);
    const [visible, setVisible] = useState(false);
    const [detail, setDetail] = useState(false);
    const [average, setAverage] = useState(0);

    // Functions
    const fetchData = () => {
        props.changeLoading(true);
        const startDate = "20200928"
        const endDate = dayjs().format("YYYYMMDD")
        const token = encrypt(startDate + endDate)
        axios.get("https://app.drjchn.com/api/v2/tieba/income", {
            params: {
                token,
                start: startDate,
                end: endDate
            }
        })
          .then(response => {
              setVisible(true);
              props.changeLoading(false);
              const { data: dt, income: inc, average: avg, month: mon } = response.data;
              mon.sort((a, b) => dayjs(b.date) - dayjs(a.date))
              setData(dt);
              setIncome(inc);
              setAverage(avg);
              setMonth(mon);
          })
          .catch(err => {
              props.changeLoading(false);
              if (err.response) {
                  message.error("Session已失效");
              } else {
                  message.error("获取数据失败")
              }
          })
    }

    const solveData = () => {
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

    // const solveMonth = () => {
    //     const result = []
    //     for (let m of month) {
    //         result.push({
    //             date: dayjs(m.date).unix() * 1000,
    //             income: m.income
    //         })
    //     }
    //
    //     return result
    // }

    const solveIncome = () => {
        return JSON.parse(JSON.stringify(month)).sort((a, b) => a.date - b.date)
    }

    const solveCharacter = () => {
        const result = []
        const data = JSON.parse(JSON.stringify(income)).sort((a, b) => dayjs(a.date) - dayjs(b.date))
        for (let i of data) {
            result.push({
                name: i.short,
                type: "五天总流水",
                income: i.income
            })
            result.push({
                name: i.short,
                type: "峰值流水",
                income: i.max
            })
        }
        return result
    }

    // Constants
    const cols = [
        {
            title: '卡池',
            dataIndex: 'name',
            render: (text, record) => {
                const days = dayjs.duration(dayjs().diff(dayjs(record.date)))
                return days.days() >= 5 || days.months() > 0 || days.years() > 0 ? text : `${text}(${days.days()}天)`
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
            render: text => detail ? text : (text / 10000).toFixed(2) + "W",
            sorter: (a, b) => a.income - b.income
        }
    ];

    // Use effect
    const isInitial = useRef(true);
    useEffect(() => {
        if (isInitial.current) {
            isInitial.current = false;
            return;
        }
        fetchData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.trigger]);

    return (
      <Drawer
        title="流水统计"
        placement="right"
        open={visible}
        width={window.outerWidth > 520 ? 500 : window.outerWidth}
        onClose={() => setVisible(false)}
        style={{ textAlign: 'center' }}
      >
          <Text style={{ marginRight: 10 }}>详细数据</Text>
          <Switch checked={detail} onChange={() => setDetail(!detail)}/>
          <Divider />
          <Title level={4}>历史流水</Title>
          <Chart
            scale={scale}
            padding={[0,30,50,80]}
            autoFit
            height={300}
            data={solveData()}
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
          <Title level={4}>角色池5日流水统计</Title>
          <Chart height={400} padding="auto" data={solveCharacter()} autoFit>
              <Interval
                adjust={[
                    {
                        type: 'dodge',
                        marginRatio: 0,
                    },
                ]}
                color="type"
                position="name*income"
              />
              <Slider
                start={0.8}
                padding={[0, 0, 0, 0]}
              />
              <Tooltip shared />
          </Chart>
          <br/>
          <Table
            dataSource={income}
            columns={cols}
            rowKey="name"
          />
          <Divider />
          <Title level={4}>每月流水统计</Title>
          <Chart height={300} autoFit data={solveIncome()} scale={incomeScale}>
              <Interval position="date*income" />
              <Slider
                start={0.8}
                padding={[0, 0, 0, 0]}
                formatter={(v) => {
                    return dayjs(v).format("YYYY-MM")
                }}
              />
              <Tooltip shared/>
          </Chart>
          <br/>
          <Table
            dataSource={month}
            columns={columns}
            rowKey="name"
          />
          <Text type="secondary" style={{ float: "left" }}>*数据来源：蝉大师</Text>
          <br/><br/>
      </Drawer>
    );

};

export default IncomeDrawer;
