import React from "react";
import { Divider, Drawer, Statistic, Switch, Table, Typography } from "antd";
import DatePicker from "./DatePicker";
import dayjs from "dayjs";
import { Chart, Line } from "bizcharts";
import axios from "axios";
import PropTypes from 'prop-types';
import NProgress from 'nprogress';

const { Text, Title } = Typography;

const scale = {
  posts: {
    min: 0,
    alias: '单日总帖数'
  },
  total: {
    alias: '总帖数'
  },
  date: {
    type: 'time',
    formatter: time => dayjs(time).format('YY-MM-DD')
  }
};

class PostsDrawer extends React.Component {
  state = {
    detail: false,
    range: {
      start: 1,
      end: 8
    },
    drawer: false,
    postData: [],
    posts: 0,
    day: {
      start: dayjs().subtract(7, "days"),
      end: dayjs().subtract(1, "days")
    }
  };

  static contextTypes = {
    onRef: PropTypes.func,
    encrypt: PropTypes.func
  }

  componentDidMount() {
    this.context.onRef(this, 'posts')
  }

  handleDateChange = (date, dateString, category) => {
    const day = { ...this.state.day };
    category ? day.start = date : day.end = date;
    this.setState({ day }, () => this.updateRange());
  };

  updateRange = () => {
    const day = { ...this.state.day };
    const range = { ...this.state.range };
    const data = this.state.postData;
    for (let i = 0; i < data.length; i++) {
      if (dayjs(data[i].date).format('YYYY-MM-DD') === dayjs(day.start).format('YYYY-MM-DD')) {
        range.end = i + 1;
      }
    }
    for (let i = 0; i < data.length; i++) {
      if (dayjs(data[i].date).format('YYYY-MM-DD') === dayjs(day.end).format('YYYY-MM-DD')) {
        range.start = i;
      }
    }
    this.setState({ range });
  };

  getPostData = () => {
    const loading = { ...this.state.loading };
    this.props.changeLoading(true);
    this.setState({ loading });
    NProgress.start();
    axios.get('https://api.drjchn.com/api/v2/tieba/post', {
      params: {
        date: dayjs().format('YYYY-MM-DD'),
        token: this.context.encrypt(dayjs().format('YYYY-MM-DD'))
      }
    }).then(rsp => {
      const day = { ...this.state.day };
      day.end = dayjs().subtract(1, "days");
      day.start = dayjs().subtract(7, "days");
      this.setState({
        posts: rsp.data.total,
        day
      });
      axios.get('https://api.drjchn.com/api/v2/tieba/posts', {
        params: {
          page: 0,
          token: this.context.encrypt(0)
        }
      }).then(resp => {
        this.props.changeLoading(false);
        let postData = resp.data.results;
        for (let i = 0; i < postData.length - 1; i++) {
          postData[i].posts = postData[i].total - postData[i + 1].total;
          postData[i].date = dayjs(postData[i].date).valueOf();
        }
        postData[postData.length - 1].date = dayjs(postData[postData.length - 1].date).valueOf();
        postData[postData.length - 1].posts = postData[postData.length - 1].total;
        const postNow = this.state.posts - postData[0].total;
        postData.splice(0, 0, {
          'date': dayjs().valueOf(),
          'total': this.state.posts,
          'posts': postNow
        });
        NProgress.done();
        this.setState({
          postData,
          loading,
          drawer: true
        });
      });
    });
  };

  render() {
    const { detail, range, drawer, postData, posts } = this.state;

    const cols = [
      {
        title: '日期',
        dataIndex: 'date',
        render: text => {
          return dayjs(text).format('YYYY-MM-DD') + '(' + dayjs(text).format('dddd')[2] + ')';
        }
      },
      {
        title: '总帖数',
        dataIndex: 'total',
        render: text => detail ? text : (text / 10000).toFixed(2) + "W"
      },
      {
        title: '当日发帖数',
        dataIndex: 'posts',
        render: text => detail ? text : (text / 10000).toFixed(2) + "W",
        sorter: (a, b) => a.posts - b.posts,
        sortDirections: ['descend', 'ascend']
      }
    ];

    return (
      <Drawer
        title="发帖统计"
        placement="right"
        width={window.outerWidth > 520 ? 500 : window.outerWidth}
        onClose={() => {
          const { range } = this.state
          range.start = 1
          range.end = 8
          this.setState({ drawer: false, range });
        }}
        visible={drawer}
        style={{ textAlign: 'center' }}
      >
        <Text style={{ marginRight: 10 }}>详细数据</Text>
        <Switch checked={detail} onChange={() => this.setState({ detail: !detail })} />
        <Divider />
        <Statistic
          title='总发帖数'
          value={posts}
          style={{ marginTop: 10 }}
          formatter={value => detail ? value : (value / 10000).toFixed(2) + "W"}
        />
        <Divider />
        <Title level={4}>发帖统计图表</Title>
        <DatePicker
          onChange={((date, dateString) => this.handleDateChange(date, dateString, true))}
          value={this.state.day.start}
          allowClear={false}
          placeholder="选择起始日期"
          disabledDate={current => current < dayjs('20191106') || current >= this.state.day.end}
        />
        <DatePicker
          style={{ marginBottom: 20 }}
          onChange={(date, dateString) => this.handleDateChange(date, dateString, false)}
          value={this.state.day.end}
          allowClear={false}
          placeholder="选择结束日期"
          disabledDate={current => current < dayjs('20191106') || current > dayjs() || (current <= this.state.day.start)}
        />
        <h3>发帖总数趋势</h3>
        <Chart 
          scale={scale} 
          padding={[0,30,30,80]} 
          autoFit 
          height={300}
          data={postData.slice(range.start, range.end)} 
        >
          <Line
            shape="smooth"
            position="date*total"
            color="l (270) 0:rgba(255, 146, 255, 1) .5:rgba(100, 268, 255, 1) 1:rgba(215, 0, 255, 1)"
          />
        </Chart>
        <h3>单日发帖趋势</h3>
        <Chart 
          scale={scale} 
          padding={[0,30,30,80]} 
          autoFit 
          height={300}
          data={postData.slice(range.start, range.end)} 
        >
          <Line
            shape="smooth"
            position="date*posts"
            color="l (270) 0:rgba(255, 146, 255, 1) .5:rgba(100, 268, 255, 1) 1:rgba(215, 0, 255, 1)"
          />
        </Chart>
        <Divider />
        <Table
          dataSource={postData}
          columns={cols}
          rowKey='date'
        />
      </Drawer>
    )
  }
}

export default PostsDrawer;