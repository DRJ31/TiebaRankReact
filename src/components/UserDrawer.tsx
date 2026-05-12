import { useEffect, useRef, useState } from "react";
import { DatePicker, Divider, Drawer, message, Progress, Statistic, Table, Typography } from "antd";
import type { TableColumnsType } from "antd";
import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  CopyOutlined,
  CrownOutlined,
  UserAddOutlined,
  UserOutlined
} from '@ant-design/icons';
import dayjs from "dayjs";
import type { Dayjs } from "dayjs";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import { Column } from "@ant-design/plots";
import axios from "axios";
import NProgress from 'nprogress';
import encrypt from "../encrypt";
import type { DistributionRecord } from "../types";

dayjs.extend(weekday);
dayjs.extend(localeData);

const { Title } = Typography;

const selectColor = (num: number) => {
  if (num > 0) {
    return "#cf1322"
  } else if (num < 0) {
    return "#3f8600"
  } else {
    return "#555"
  }
}

const cols: TableColumnsType<DistributionRecord> = [
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
    render: (text: number) => (
      <Statistic
        value={Math.abs(text)}
        valueStyle={{
          color: selectColor(text),
          fontSize: 15
        }}
        prefix={text !== 0 && (text > 0 ? <ArrowUpOutlined /> : <ArrowDownOutlined />)}
      />
    )
  }
];

interface UserDrawerProps {
  changeLoading: (loading: boolean) => void;
  trigger: boolean;
}

interface PercentState {
  ten?: number;
  membership?: number;
  vip?: number;
  signin?: number;
}

interface UserStatState {
  membership: number;
  vip: number;
  ten: number;
  total: number;
  average: number;
  signin: number;
}

const UserDrawer = (props: UserDrawerProps) => {
  // States
  const [distribution, setDistribution] = useState<DistributionRecord[]>([]);
  const [percent, setPercent] = useState<PercentState>({});
  const [data, setData] = useState<UserStatState>({
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
  const getStatisticalData = (date: Dayjs) => {
    setDay(date);
    props.changeLoading(true);
    NProgress.start();
    axios.get('https://app.drjchn.com/api/v2/tieba/distribution', {
      params: {
        token: encrypt(date.format("YYYY-MM-DD")),
        date: date.format("YYYY-MM-DD")
      }
    }).then(rsp => {
      const response = rsp.data as {
        distribution: DistributionRecord[];
        membership: number;
        vip: number;
        signin: number;
        total: number;
        posts: number;
      };
      const dis = response.distribution;
      dis[0].count = dis[0].rank;
      for (let i = 1; i < dis.length; i++) {
        dis[i].count = dis[i].rank - dis[i - 1].rank;
      }
      for (const distribute of dis) {
        if (distribute.level === 10) {
          const pc = percent;
          const dt = data;
          dt.ten = distribute.rank;
          dt.membership = response.membership;
          dt.vip = response.vip;
          dt.signin = response.signin;
          dt.total = response.total;
          dt.average = Number((response.posts / response.total).toFixed(2));
          pc.ten = Number((distribute.rank / response.total * 100).toFixed(2));
          pc.membership = Number((dt.membership / response.total * 100).toFixed(2));
          pc.vip = Number((response.vip / response.total * 100).toFixed(2));
          pc.signin = Number((response.signin / response.total * 100).toFixed(2));
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
        onChange={date => {
          if (date) getStatisticalData(date);
        }}
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
                format={value => Number(value) > 0 ? value + '%' : 'NaN'} />
      <Statistic value={data.signin} prefix={<UserAddOutlined />} style={{ marginTop: 10 }}
                 formatter={value => Number(value) > 0 ? value : '无数据'} />
      <Divider />
      <Title level={4}>人均发帖数</Title>
      <Statistic value={data.average} prefix={<CopyOutlined />} style={{ marginTop: 10 }} />
      <Divider />
      <Title level={4}>等级分布</Title>
      <Column
        height={300}
        data={distribution}
        xField="level"
        yField="count"
        label={{ text: 'count', position: 'top' }}
        axis={{
          x: { title: '等级' },
          y: { title: '人数' }
        }}
      />
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
