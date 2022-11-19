import React from "react";
import { FloatButton, Col, Drawer, List, Row, Spin, Statistic, Table, Tabs, Tag, Timeline, Typography } from "antd";
import { LoadingOutlined } from '@ant-design/icons';
import dayjs from "dayjs";
import axios from "axios";
import PropTypes from 'prop-types';

const { TabPane } = Tabs;
const { Text, Title } = Typography;

const cols = [
  {
    title: '地区',
    dataIndex: 'title'
  },
  {
    title: '确诊',
    dataIndex: 'diagnose',
    render: (text) => <Text style={{ color: '#cf1322' }}>{text}</Text>,
    sorter: (a, b) => a.diagnose - b.diagnose,
    sortDirections: ['descend', 'ascend']
  },
  {
    title: '疑似',
    dataIndex: 'suspected',
    sorter: (a, b) => a.suspected - b.suspected,
    sortDirections: ['descend', 'ascend']
  },
  {
    title: '治愈',
    dataIndex: 'cure',
    render: (text) => <Text style={{ color: '#008dff' }}>{text}</Text>,
    sorter: (a, b) => a.cure - b.cure,
    sortDirections: ['descend', 'ascend']
  },
  {
    title: '死亡',
    dataIndex: 'die',
    sorter: (a, b) => a.die - b.die,
    sortDirections: ['descend', 'ascend']
  },
  {
    title: '总数',
    dataIndex: 'total',
    sorter: (a, b) => a.total - b.total,
    sortDirections: ['descend', 'ascend']
  }
];

let loadable = true;

class VirusDrawer extends React.Component {
  state = {
    loading: {
      virus: false,
      news: true
    },
    key: "1",
    virus: {
      global_stats: {
        diagnose: 0,
        suspected: 0,
        cure: 0,
        die: 0,
        total: 0,
        time: dayjs().format("YYYY-MM-DD HH:mm:ss")
      },
      prov_stats: [],
      other_stats: [],
      news: [],
      page: 1
    },
    drawer: false,
    tab: null
  };

  componentDidMount() {
    this.context.onRef(this, 'virus');
  }

  static contextTypes = {
    onRef: PropTypes.func
  }

  getVirusData = () => {
    this.props.changeLoading(true);
    axios.get('https://h5.peopleapp.com/2019ncov/Home/index')
      .then(response => {
        let virus = response.data;
        virus.news = [];
        virus.page = 1;
        this.props.changeLoading(false);
        this.setState({
          virus,
          drawer: true
        })
      });
  };

  sortProvince = (x, y) => {
    return x.total < y.total ? 1 : -1;
  };

  getVirusRate = (data) => {
    const global_stats = this.state.virus.global_stats;
    return (data / (global_stats.total + global_stats.die + global_stats.cure) * 100).toFixed(2);
  };

  getNews = (refresh) => {
    const { loading } = this.state;
    const virus = this.state.virus;
    loading.news = true;
    this.setState({ loading });
    if (refresh) {
      virus.news = [];
      virus.page = 1;
      const tab = document.getElementById("tab");
      if (tab) {
        tab.scrollTop = 0;
      }
    } else {
      virus.page += 1;
    }
    axios.get("https://h5.peopleapp.com/2019ncov/newsApi", {
      params: {
        type: 2,
        page_size: 10,
        page: virus.page
      }
    }).then(response => {
      for (let data of response.data.items) {
        virus.news.push(data)
      }
      loading.news = false;
      this.setState({
        loading,
        virus
      }, () => {
        loadable = true;
        if (!this.state.tab) {
          const tab = document.getElementById("tab");
          tab.addEventListener('scroll', e => {
            const { scrollTop, scrollHeight, clientHeight } = e.target;
            if (scrollTop + clientHeight >= scrollHeight && loadable && scrollTop !== 0) {
              loadable = false;
              this.getNews(false);
            }
          });
          this.setState({ tab });
        }
      });
    })
  };

  render() {
    const { loading, key, drawer, virus } = this.state;

    return (
      <Drawer
        title="疫情实况"
        placement="right"
        width={window.outerWidth > 520 ? 500 : window.outerWidth}
        onClose={() => this.setState({ drawer: false, key: "1" })}
        open={drawer}
        style={{ textAlign: 'center' }}
      >
        <Tabs
          activeKey={key}
          onTabClick={key => {
            this.setState({ key });
            if (key.toString() === "3") {
              this.getNews(true);
            }
          }}
        >
          <TabPane
            tab="国内数据"
            key="1"
          >
              <Tag color="red">截止 {virus.global_stats.time} 数据统计</Tag>
              <Row style={{ marginTop: 10, marginBottom: 10 }}>
                <Col span={6}>
                  <Statistic title="确诊" value={virus.global_stats.diagnose} valueStyle={{ color: '#cf1322' }} />
                  <Statistic title="比例" value={this.getVirusRate(virus.global_stats.diagnose)} suffix="%"
                             valueStyle={{ color: '#cf1322' }} />
                </Col>
                <Col span={6}>
                  <Statistic title="疑似" value={virus.global_stats.suspected} />
                  <Statistic title="比例" value={this.getVirusRate(virus.global_stats.suspected)} suffix="%" />
                </Col>
                <Col span={6}>
                  <Statistic title="治愈" value={virus.global_stats.cure} valueStyle={{ color: '#008dff' }} />
                  <Statistic title="比例" value={this.getVirusRate(virus.global_stats.cure)} suffix="%"
                             valueStyle={{ color: '#008dff' }} />
                </Col>
                <Col span={6}>
                  <Statistic title="死亡" value={virus.global_stats.die} />
                  <Statistic title="比例" value={this.getVirusRate(virus.global_stats.die)} suffix="%" />
                </Col>
              </Row>
              <Table
                columns={cols}
                dataSource={virus.prov_stats.sort(this.sortProvince)}
                rowKey='title'
                scroll={{ x: 500 }}
              />
          </TabPane>
          <TabPane tab="国际数据" key="2" style={{ height: window.innerHeight - 165, overflow: 'auto' }}>
            <List dataSource={virus.other_stats} renderItem={item => <List.Item>{item.title}</List.Item>} />
          </TabPane>
          <TabPane tab="实时播报" key="3" style={{ height: window.innerHeight - 165, overflow: 'auto' }}>
            <div id="tab" style={{ height: window.innerHeight - 165, overflow: 'auto' }}>
            <Spin spinning={loading.news} indicator={<LoadingOutlined spin />} style={{ marginBottom: 15 }} />
            <Timeline style={{ textAlign: 'left' }}>
              {virus.news.map(item => (
                <Timeline.Item key={item.publish_time}>
                  <Text style={{ marginRight: 10 }}>{dayjs(item.publish_time).fromNow()}</Text>
                  <Text>{item.publish_time}</Text>
                  <Title level={4}>{item.title}</Title>
                  <Text>{item.content}</Text>
                </Timeline.Item>
              ))}
            </Timeline>
              <FloatButton.BackTop target={() => document.getElementById("tab")}/>
            </div>
          </TabPane>
        </Tabs>
      </Drawer>
    )
  }
}

export default VirusDrawer;