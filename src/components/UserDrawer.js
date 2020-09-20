import React from "react";
import { DatePicker, Divider, Drawer, Icon, Progress, Statistic, Table, Typography, message } from "antd";
import moment from "moment";
import { Axis, Chart, Geom, Label } from "bizcharts";
import axios from "axios";
import PropTypes from 'prop-types';
import NProgress from 'nprogress';

const { Title } = Typography;


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
        value={text}
        valueStyle={{
          color: text > 0 ? '#cf1322' : '#555',
          fontSize: 15
        }}
        prefix={text > 0 && <Icon type="arrow-up" />}
      />
    )
  }
];

class UserDrawer extends React.Component {
  state = {
    distribution: [],
    percent: {
      ten: null,
      membership: null,
      vip: null,
      signin: null
    },
    data: {
      membership: 0,
      vip: 0,
      ten: 0,
      total: 0,
      average: 0,
      signin: 0
    },
    drawer: false,
    day: moment()
  };

  static contextTypes = {
    onRef: PropTypes.func,
    encrypt: PropTypes.func
  }

  componentDidMount() {
    this.context.onRef(this, 'users');
  }

  getStatisticalData = (date) => {
    this.setState({ day: date });
    this.props.changeLoading(true);
    NProgress.start();
    axios.get('https://api.drjchn.com/api/tieba/users/distribution', {
      params: {
        token: this.context.encrypt(date.format("YYYY-MM-DD")),
        date: date.format("YYYY-MM-DD")
      }
    }).then(rsp => {
      let distribution = rsp.data.distribution;
      distribution[0].count = distribution[0].rank;
      for (let i = 1; i < distribution.length; i++) {
        distribution[i].count = distribution[i].rank - distribution[i - 1].rank;
      }
      for (let distribute of distribution) {
        if (distribute.level === 10) {
          let percent = {};
          let data = this.state.data;
          data.ten = distribute.rank;
          data.membership = rsp.data.membership;
          data.vip = rsp.data.vip;
          data.signin = rsp.data.signin;
          data.total = rsp.data.total;
          data.average = Number((rsp.data.posts / rsp.data.total).toFixed(2));
          percent.ten = Number((distribute.rank / rsp.data.total * 100).toFixed(2));
          percent.membership = Number((data.membership / rsp.data.total * 100).toFixed(2));
          percent.vip = Number((rsp.data.vip / rsp.data.total * 100).toFixed(2));
          percent.signin = Number((rsp.data.signin / rsp.data.total * 100).toFixed(2));
          this.props.changeLoading(false);
          NProgress.done();
          this.setState({
            drawer: true,
            distribution,
            posts: rsp.data.posts,
            percent,
            data
          });
        }
      }
    }).catch(err => {
      this.props.changeLoading(false);
      NProgress.done();
      message.error("记录丢失，数据加载失败");
    });
  };

  render() {
    const { distribution, data, percent, drawer, day } = this.state;

    return (
      <Drawer
        title="用户统计"
        placement="right"
        width={window.outerWidth > 520 ? 500 : window.outerWidth}
        onClose={() => this.setState({ drawer: false })}
        visible={drawer}
        style={{ textAlign: 'center' }}
      >
        <DatePicker
          onChange={this.getStatisticalData}
          disabledDate={current => current < moment('20191107') || current > moment()}
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
        <Statistic value={data.membership} prefix={<Icon type="user" />} style={{ marginTop: 10 }} />
        <Divider />
        <Title level={4}>VIP比例</Title>
        <Progress type='circle' percent={percent.vip} strokeColor='#f5222d' />
        <Statistic value={data.vip} prefix={<Icon type="crown" />} style={{ marginTop: 10 }} />
        <Divider />
        <Title level={4}>签到人数</Title>
        <Progress type='circle' percent={percent.signin} strokeColor='#fa8c16'
                  format={percent => percent > 0 ? percent + '%' : 'NaN'} />
        <Statistic value={data.signin} prefix={<Icon type="usergroup-add" />} style={{ marginTop: 10 }}
                   formatter={value => value > 0 ? value : '无数据'} />
        <Divider />
        <Title level={4}>人均发帖数</Title>
        <Statistic value={data.average} prefix={<Icon type="copy" />} style={{ marginTop: 10 }} />
        <Divider />
        <Title level={4}>等级分布</Title>
        <Chart height={300} data={distribution} scale={{ level: { range: [0.05, 1] } }} forceFit>
          <Axis name="level" />
          <Axis name="count" />
          <Geom type="interval" position="level*count">
            <Label content={['level*count', (name, value) => value]} />
          </Geom>
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
}

export default UserDrawer;