import React, { useEffect, useRef, useState } from "react";
import { DatePicker, Divider, Drawer, message, Progress, Statistic, Table, Typography } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  CrownOutlined,
  UserAddOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import { Chart, Interval } from "bizcharts";
import axios from "axios";
import NProgress from 'nprogress';
import encrypt from "../encrypt";

dayjs.extend(weekday);
dayjs.extend(localeData);

const { Title } = Typography;

const selectColor = (num) => {
  if (num > 0) {
    return "#cf1322"
  } else if (num < 0) {
    return "#3f8600"
  } else {
    return "#555"
  }
}

const cols = [
  {
    title: '等级',
    dataIndex: 'level'
  },
  {
    title: '排名',
    dataIndex: 'rank'
  },
  {
    title: '变化',
    dataIndex: 'delta',
    render: text => (
      <Statistic
        value={Math.abs(text)}
        valueStyle={{
          color: selectColor(text),
          fontSize: 15
        }}
        prefix={parseInt(text) !== 0 && (text > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />)}
      />
    )
  }
];

const UserDrawer = (props) => {
  // States
  const [distribution, setDistribution] = useState([]);
  const [percent, setPercent] = useState({
    ten: null,
    membership: null,
    vip: null,
    signin: null,
  });
  const [data, setData] = useState({
    membership: 0,
    vip: 0,
    ten: 0,
    total: 0,
    average: 0,
    signin: 0
  });
  const [drawer, setDrawer] = useState(false);
  const [day, setDay] = useState(dayjs());

  // Functions
  const getStatisticalData = (date) => {
    setDay(date);
    props.changeLoading(true);
    NProgress.start();
    axios.get('https://app.drjchn.com/api/v2/tieba/distribution', {
      params: {
        token: encrypt(date.format("YYYY-MM-DD")),
        date: date.format("YYYY-MM-DD")
      }
    }).then(rsp => {
      let dis = rsp.data.distribution;
      dis[0].count = dis[0].rank;
      for (let i = 1; i < dis.length; i++) {
        dis[i].count = dis[i].rank - dis[i - 1].rank;
      }
      for (let distribute of dis) {
        if (distribute.level === 10) {
          const pc = percent;
          const dt = data;
          dt.ten = distribute.rank;
          dt.membership = rsp.data.membership;
          dt.vip = rsp.data.vip;
          dt.signin = rsp.data.signin;
          dt.total = rsp.data.total;
          dt.average = Number((rsp.data.posts / rsp.data.total).toFixed(2));
          pc.ten = Number((distribute.rank / rsp.data.total * 100).toFixed(2));
          pc.membership = Number((data.membership / rsp.data.total * 100).toFixed(2));
          pc.vip = Number((rsp.data.vip / rsp.data.total * 100).toFixed(2));
          pc.signin = Number((rsp.data.signin / rsp.data.total * 100).toFixed(2));
          props.changeLoading(false);
          NProgress.done();
          setDrawer(true);
          setDistribution(dis);
          setPercent(pc);
          setData(dt);
        }
      }
    }).catch(err => {
      console.log(err);
      props.changeLoading(false);
      NProgress.done();
      message.error("记录丢失，数据加载失败");
    });
  };

  // Use effect
  const isInitial = useRef(true);
  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      return;
    }
    getStatisticalData(day);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.trigger]);

  return (
    <Drawer
      title="用户统计"
      placement="right"
      width={window.outerWidth > 520 ? 500 : window.outerWidth}
      onClose={() => setDrawer(false)}
      open={drawer}
      style={{ textAlign: 'center' }}
    >
      <DatePicker
        onChange={getStatisticalData}
        disabledDate={current => current < dayjs('20191107') || current > dayjs()}
        value={day}
        allowClear={false}
        placeholder="选择日期"
        style={{ marginBottom: 20 }}
      />
      <Title level={4}>黄牌率</Title>
      <Progress type='circle' percent={percent.ten} strokeColor='#ffec3d' />
      <Statistic value={data.ten} suffix={"/ " + data.total} style={{ marginTop: 10 }} />
      <Divider />
      <Title level={4}>会员率</Title>
      <Progress type='circle' percent={percent.membership} />
      <Statistic value={data.membership} prefix={<UserOutlined />} style={{ marginTop: 10 }} />
      <Divider />
      <Title level={4}>VIP比例</Title>
      <Progress type='circle' percent={percent.vip} strokeColor='#f5222d' />
      <Statistic value={data.vip} prefix={<CrownOutlined />} style={{ marginTop: 10 }} />
      <Divider />
      <Title level={4}>签到人数</Title>
      <Progress type='circle' percent={percent.signin} strokeColor='#fa8c16'
                format={percent => percent > 0 ? percent + '%' : 'NaN'} />
      <Statistic value={data.signin} prefix={<UserAddOutlined />} style={{ marginTop: 10 }}
                 formatter={value => value > 0 ? value : '无数据'} />
      <Divider />
      <Title level={4}>人均发帖数</Title>
      <Statistic value={data.average} prefix={<CopyOutlined />} style={{ marginTop: 10 }} />
      <Divider />
      <Title level={4}>等级分布</Title>
      {/* <Chart height={300} data={distribution} scale={{ level: { range: [0.05, 1] } }} forceFit>
          <Axis name="level" />
          <Axis name="count" />
          <Geom type="interval" position="level*count">
            <Label content={['level*count', (name, value) => value]} />
          </Geom>
        </Chart> */}
      <Chart
        height={300}
        autoFit
        data={distribution}
        scale={{ count: { alias: '人数' }, level: { alias: '等级' } }}
        padding={[50,30,30,50]}
      >
        <Interval position="level*count" label="count" />
      </Chart>
      <Divider />
      <Title level={4}>等级排名</Title>
      <Table
        columns={cols}
        dataSource={distribution}
        pagination={{ pageSize: 20 }}
        rowKey='rank'
      />
    </Drawer>
  )
}

export default UserDrawer;
