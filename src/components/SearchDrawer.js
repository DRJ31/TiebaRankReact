import React from 'react';
import { Button, Card, Drawer, Input, message, Select, Spin, Table, Typography } from "antd";
import DatePicker from "./DatePicker";
import { LoadingOutlined, CrownFilled, InfoCircleOutlined } from '@ant-design/icons';
import dayjs from "dayjs";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import axios from "axios";
import Swal from "sweetalert2";
import PropTypes from 'prop-types';

dayjs.extend(weekday);
dayjs.extend(localeData);

const { Search } = Input;
const { Text, Paragraph } = Typography;
const { Option } = Select;

class SearchDrawer extends React.Component {
  state = {
    keyword: '',
    anniversary: "20200928",
    anniversaries: [],
    drawer: false,
    loading: false,
    searchData: [],
    events: [],
    event_date: dayjs(),
    visible: false
  };

  cols = [
    {
      title: '事件',
      dataIndex: 'event',
      render: (text, record) => (
          <Button type="text"
                  onClick={() => Swal.fire(text, record.description, 'info')}
          >{text}<InfoCircleOutlined style={{ color: "#3fc3ee" }} /></Button>
      )
    },
    {
      title: '日期',
      dataIndex: 'date',
      render: (text, record) => `${dayjs(text).format("YYYY年MM月DD日")}`
    },
    {
      title: '描述',
      dataIndex: 'date',
      render: (text, record) => `已${record.adj}${this.state.event_date.diff(dayjs(text), "days") + 1}天`
    }
  ];

  static contextTypes = {
    onRef: PropTypes.func,
    encrypt: PropTypes.func
  }

  componentDidMount() {
    this.context.onRef(this, 'search');
    const today = dayjs().format("YYYY-MM-DD");
    axios.get('https://api.drjchn.com/api/v2/tieba/event', {
      params: {
        date: today,
        token: this.context.encrypt(today)
      }
    }).then(res => {
      let events = res.data.event.length > 0 ? res.data.event : ["无"];
      this.setState({ events });
    });
  }

  handleDayChange = (date, dateString) => {
    let anniversary = this.state.anniversary;
    if (date < dayjs(anniversary)) {
      anniversary = "20190621"
    }
    this.setState({ event_date: date });
    axios.get('https://api.drjchn.com/api/v2/tieba/event', {
      params: {
        date: dateString,
        token: this.context.encrypt(dateString)
      }
    }).then(res => {
      let events = res.data.event.length > 0 ? res.data.event : ["无"];
      this.setState({ events, anniversary });
    });
  };

  handleSearch = kw => {
    let keyword = kw;
    if (keyword.length === 0) {
      this.setState({ searchData: [] });
      return;
    }
    this.setState({ loading: true });
    axios.get('https://api.drjchn.com/api/v2/tieba/user', {
      params: {
        keyword: keyword,
        token: this.context.encrypt(keyword)
      }
    }).then(rsp => {
      this.setState({
        searchData: rsp.data.users,
        keyword,
        loading: false
      });
    }).catch(err => {
      this.setState({ loading: false });
      message.error("搜索用户信息失败");
    });
  };

  render() {
    const { keyword, drawer, loading, events, anniversary, searchData, visible } = this.state;
    const columns = [
      {
        title: '排名',
        dataIndex: 'rank'
      },
      {
        title: '吧友',
        dataIndex: 'name',
        render: (text, record) => (
          <Button type="text" onClick={() => {
            this.setState({
              spin: true,
              loading: true
            });
            axios.post('https://api.drjchn.com/api/v2/tieba/user', {
              link: record.link,
              token: this.context.encrypt(record.link)
            }).then(rsp => {
              this.setState({
                link: rsp.data.user.avatar,
                spin: false,
                loading: false
              }, () => {
                const nickname = rsp.data.user.nickname;
                const title = !record.member ? nickname :
                  '<span><i aria-label="icon: crown" class="anticon anticon-crown" style="color: rgb(255, 197, 61);"><svg viewBox="64 64 896 896" focusable="false" class="" data-icon="crown" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M899.6 276.5L705 396.4 518.4 147.5a8.06 8.06 0 0 0-12.9 0L319 396.4 124.3 276.5c-5.7-3.5-13.1 1.2-12.2 7.9L188.5 865c1.1 7.9 7.9 14 16 14h615.1c8 0 14.9-6 15.9-14l76.4-580.6c.8-6.7-6.5-11.4-12.3-7.9zM512 734.2c-62.1 0-112.6-50.5-112.6-112.6S449.9 509 512 509s112.6 50.5 112.6 112.6S574.1 734.2 512 734.2zm0-160.9c-26.6 0-48.2 21.6-48.2 48.3 0 26.6 21.6 48.3 48.2 48.3s48.2-21.6 48.2-48.3c0-26.6-21.6-48.3-48.2-48.3z"></path></svg></i> <span class="ant-typography ant-typography-danger">' + nickname + '</span></span>';
                Swal.fire({
                  imageUrl: this.state.link,
                  title: title,
                  text: text
                });
              });
            }).catch(err => {
              message.error("该用户不存在");
              this.setState({
                spin: false,
                loading: false
              });
            });
          }}>
            {!record.member ? (record.nickname ? record.nickname : text) : (
              <span><CrownFilled style={{ color: '#ffc53d' }} /> <Text
                type='danger'>{record.nickname ? record.nickname : text}</Text></span>
            )}
          </Button>
        )
      },
      {
        title: '等级',
        dataIndex: 'level'
      },
      {
        title: '经验值',
        dataIndex: 'exp'
      }
    ];

    return (
      <Drawer
        title="搜索"
        placement="right"
        width={window.outerWidth > 520 ? 500 : window.outerWidth}
        onClose={() => this.setState({ visible: false })}
        visible={visible}
        style={{ textAlign: 'center' }}
      >
        <Drawer
          title="黑暗史记"
          placement="right"
          width={window.outerWidth > 520 ? 500 : window.outerWidth}
          onClose={() => {
            this.setState({ drawer: false });
          }}
          visible={drawer}
          style={{ textAlign: 'center' }}
        >
          <Table columns={this.cols} dataSource={this.props.anniversaries} rowKey='event' />
        </Drawer>
        <Search
          placeholder='搜索用户'
          value={keyword}
          onChange={e => {
            if (e.target.value.length === 0) {
              this.setState({ results: this.state.data })
            }
            this.setState({ keyword: e.target.value })
          }}
          onSearch={this.handleSearch}
          allowClear
        />
        <Spin
          tip='加载中...'
          spinning={loading}
          indicator={<LoadingOutlined />}
        >
          <Table
            dataSource={searchData}
            columns={columns}
            rowKey='rank'
            style={{
              background: '#fff',
              marginTop: 20,
              marginBottom: 40
            }}
          />
        </Spin>
        <Card title="大事件">
          {this.state.event_date >= dayjs('20190621') &&
          <div>
            <Select value={anniversary} style={{ width: 100, marginRight: 10 }}
                    onChange={anniversary => this.setState({ anniversary })}>
              {this.props.anniversaries.map(ann => this.state.event_date >= dayjs(ann.date) && (
                <Option value={ann.date} key={ann.date}>
                  {ann.event.match(/\(/g) ? ann.event.split("(")[0] : ann.event}
                </Option>
              ))}
            </Select>
            <Text>第 {this.state.event_date.diff(dayjs(anniversary), "days") + 1} 天</Text>
            <Button type="primary" style={{ marginLeft: 10 }} onClick={() => {
              this.setState({ drawer: true });
            }}>汇总</Button>
          </div>}
          <DatePicker
            style={{ marginBottom: 20, marginTop: 20 }}
            onChange={this.handleDayChange}
            value={this.state.event_date}
            allowClear={false}
            placeholder="选择日期"
            dateRender={current => {
              const days = this.props.days;
              const style = {};
              if (days.indexOf(current.format("YYYY-MM-DD")) !== -1) {
                style.border = '1px solid #1890ff';
                style.borderRadius = '50%';
              }
              return (
                <div className="ant-picker-cell-inner" style={style}>
                  {current.date()}
                </div>
              );
            }}
          />
          {events.length === 1 ? <Paragraph>{events[0]}</Paragraph> :
            events.map((val, i) => (
              <Paragraph key={"event" + i}>{i + 1}. {val}</Paragraph>
            ))}
        </Card>
      </Drawer>
    )
  }
}

export default SearchDrawer;