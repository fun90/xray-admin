<template>
  <div class="dashboard-editor-container">
    <el-form v-if="account" size="mini">
      <el-row>
        <el-col :xs="24" :sm="24" :lg="24" class="card-panel-col-first">
          <el-card>
            <div slot="header">
              使用说明
            </div>
            <el-row>
              <el-col :xs="24" :sm="24" :lg="12">
                <Notice name="必读" />
              </el-col>
            </el-row>
          </el-card>
        </el-col>
      </el-row>
      <el-row>
        <el-col :span="12" class="card-panel-col-first">
          <el-card class="box-card">
            <div slot="header" class="clearfix">
              <span>有效时间: </span>
              <span v-if="account.toDate>new Date().getTime()">  {{ account.toDate | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
              <span v-else style="color: red; ">  {{ account.toDate | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
            </div>
            <div class="text item">
              <h2>{{ days }}天</h2>
            </div>
          </el-card>
        </el-col>
        <el-col :span="12" class="card-panel-col">
          <el-card class="box-card">
            <div slot="header" class="clearfix">
              <span style="padding-right: 20px">流量结算时间: {{ account.statVO.toDate | parseTime('{y}-{m}-{d} {h}:{i}') }}</span>
              <span v-if="(account.statVO?(account.statVO.flow/1024/1024/1024).toFixed(2) : 0)<account.bandwidth" style="font-weight: bold">{{ account.statVO ? (account.statVO.flow / 1024 / 1024 / 1024).toFixed(2) : 0 }}</span>
              <span v-else style="font-weight: bold; color: red">{{ account.statVO ? (account.statVO.flow / 1024 / 1024 / 1024).toFixed(2) : 0 }}</span>/{{ account.bandwidth }}GB/{{ account.cycle }}天
            </div>
            <div class="text item">
              <el-progress type="circle" width="64" :percentage="parseFloat((account.statVO.flow / 1024 / 1024 / 10 / account.bandwidth).toFixed(2))" />
            </div>
          </el-card>
        </el-col>
      </el-row>
      <el-row :gutter="20">
        <el-col :xs="24" :sm="24" :lg="24" class="card-panel-col-first">
          <el-card>
            <div slot="header">
              账号: {{ account.accountNo }}
              <!-- <el-button style="float: right; padding: 3px 0" type="text">操作按钮</el-button> -->
            </div>
            <el-row>
              <el-col :xs="24" :sm="24" :lg="12">
                <el-form-item label=" 账号状态:">
                  <span>
                    <font v-if="account.status == 1">  {{ account.status |accountStatusFilter }}</font>
                    <font v-else color="red">  {{ account.status |accountStatusFilter }}</font>
                  </span>
                </el-form-item>
                <el-form-item label="1、选择客户端类型:" class="strong-label">
                  <el-col :xs="24" :sm="6" :lg="6">
                    <el-select v-model="currentAppType" placeholder="请选择" @change="changeAppType">
                      <el-option
                        v-for="item in appTypes"
                        :key="item.value"
                        :label="item.label"
                        :value="item.value"
                      />
                    </el-select>
                  </el-col>
                </el-form-item>

                <el-form-item label="2、复制订阅链接">
                  <el-col>
                    <el-input v-model="account.subscriptionUrl2" readonly>
                      <el-button slot="append" @click="generatorNewSubscriptionUrl()">
                        <div v-if="!account.subscriptionUrl2">生成</div>
                        <div v-if="account.subscriptionUrl2">更新</div>
                      </el-button>
                      <el-button slot="prepend" @click="handlerCopy(account.subscriptionUrl2,$event)">复制</el-button>
                    </el-input>
                  </el-col>
                </el-form-item>
              </el-col>

              <el-col :xs="24" :sm="24" :lg="12">
                <div v-if="account.subscriptionUrl2">
                  <el-form-item label="订阅链接二维码">
                    <vue-qr :text="account.subscriptionUrl2" qid="qrcode2" />
                  </el-form-item>
                </div>
              </el-col>
            </el-row>

          </el-card>
        </el-col>

      </el-row>

    </el-form>
  </div>
</template>
<script>
import { getAccount, generatorSubscriptionUrl } from '@/api/account'
import clip from '@/utils/clipboard'
import VueQr from 'vue-qr'
import store from '@/store'
import permission from '@/directive/permission/index.js'
import { getAccountLevels, getClients } from '@/api/config'
import Notice from '../dashboard/vip/components/Notice'

export default {
  name: 'UserAccount',
  components: { VueQr, Notice },
  directives: { permission },
  filters: {
    speedFilter: function(v) {
      if (v <= 1024) {
        return '流畅'
      } else if (v > 1024 && v <= 2024) {
        return '高速'
      } else {
        return '极速'
      }
    },
    statusFilter(status) {
      const statusMap = {
        '1': 'success',
        '0': 'danger'
      }
      return statusMap[status]
    }, accountStatusFilter(status) {
      const statusMap = {
        '1': '正常',
        '0': '禁用'
      }
      return statusMap[status]
    },
    statusFilter2(status) {
      const statusMap = {
        '1': '在线',
        '0': '下线'
      }
      return statusMap[status]
    }

  },
  data() {
    return {
      levelOptions: null,
      appTypes: null,
      currentAppType: 'clash3',
      serverId: null,
      server: null,
      accountFormOptions: [{
        value: 1,
        label: '正常'
      }, {
        value: 0,
        label: '禁止'
      }],
      accountForm: {
        id: null,
        toDate: null,
        cycle: null,
        accountNo: null,
        bandwidth: null,
        fromDate: null,
        status: '1',
        addDay: 0
      },
      connections: 0, // connections 是全局的不是row基本，坑
      accountDialog: false,

      roles: store.getters.roles,
      v2rayAccount: null,
      toColip: '',
      opAccountId: null,
      serverTotal: 0,
      chooseServerId: null,
      serverListQuery: {
        page: 1,
        pageSize: 10
      },
      serverList: null,
      account: null,
      total: 0,
      listLoading: true,
      listQuery: {
        page: 1,
        pageSize: 20,
        userEmail: ''
      },
      days: 0
    }
  },
  computed: {},
  created() {
    this.getRemoteAccount()
    getClients().then(response => {
      this.appTypes = response.obj
    })
    getAccountLevels().then(response => {
      this.levelOptions = response.obj
    })
  },
  methods: {
    changeAppType(appTypeValue) {
      this.currentAppType = appTypeValue
      appTypeValue = appTypeValue === 'shadowrocket' ? 'clash3' : appTypeValue
      if (this.account.subconverterUrl !== '0' && this.account.subscriptionUrl) {
        this.account.subscriptionUrl2 = this.account.subconverterUrl + '?target=' + appTypeValue + '&url=' + encodeURIComponent(this.account.subscriptionUrl)
      } else {
        const urlObj = new URL(this.account.subscriptionUrl)
        urlObj.searchParams.set('target', appTypeValue)
        urlObj.searchParams.set('type', '1')
        this.account.subscriptionUrl2 = urlObj.toString()
      }
    },
    generatorNewSubscriptionUrl() {
      const isEdit = !!this.account.subscriptionUrl
      if (isEdit) {
        this.$confirm('确认更新操作？成功原订阅链接将失效。', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          roundButton: true,
          center: false
        }).then(() => {
          this.trueGeneratorSubscriptionUrl()
        }).catch(() => {

        })
      } else {
        this.trueGeneratorSubscriptionUrl()
      }
    },
    trueGeneratorSubscriptionUrl() {
      generatorSubscriptionUrl().then(response => {
        this.getRemoteAccount()
        this.$message.success('更新订阅链接成功，原地址已经失效')
      })
    },
    handlerCopy(text, event) {
      clip(text, event)
    },
    formatDate(date) {
      if (!date) return ''
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      const day = date.getDate()
      const hour = date.getHours()
      const minute = date.getMinutes()
      const second = date.getSeconds()
      return year + '-' + month + '-' + day + ' ' + hour + ':' + minute + ':' + second
    },
    getRemoteAccount() {
      // var isAdmin=this.roles.indexOf('admin')>-1;

      getAccount(1).then(response => {
        this.account = response.obj
        if (this.account.subconverterUrl !== '0' && this.account.subscriptionUrl) {
          this.account.subscriptionUrl2 = this.account.subconverterUrl + '?target=' + this.currentAppType + '&url=' + encodeURIComponent(this.account.subscriptionUrl)
        } else {
          this.account.subscriptionUrl2 = this.account.subscriptionUrl
        }
        this.days = ((this.account.toDate - new Date().getTime()) / 3600000 / 24).toFixed(0)
        this.days = this.days > 0 ? this.days : 0
      })
    },
    levelFilter(status) {
      const opts = this.levelOptions
      for (const i in opts) {
        if (status === opts[i].value) {
          return opts[i].label
        }
      }
      return null
    }
  }
}
</script>
<style lang="scss" scoped>
.form-item {
  margin-bottom: 10px;
}

.card-panel-col-first {
  margin-bottom: 20px;
}

.card-panel-col {
  padding-left: 10px;
  margin-bottom: 20px;
}

.dashboard-editor-container {

  padding: 10px;
  // background-color: rgb(240, 242, 245);
  position: relative;

  .chart-wrapper {
    background: #fff;
    padding: 16px 16px 0;
    margin-bottom: 32px;
  }
}

@media (max-width: 1024px) {
  .chart-wrapper {
    padding: 8px;
  }
}
</style>
