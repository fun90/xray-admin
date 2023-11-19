<template>
  <div class="createPost-container" style="margin-right: 50px; margin-top: 30px">
    <el-form ref="postForm" :model="postForm" :rules="rules" class="form-container" label-width="150px">

      <el-form-item label="服务器名称" prop="serverName">
        <el-input v-model="postForm.serverName" />
      </el-form-item>
      <el-form-item label="协议" prop="protocol">
        <el-select v-model="postForm.protocol" @change="changeProtocol">
          <el-option
            v-for="item in protocolOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="代理地址" prop="v2rayIp">
        <el-input v-model="postForm.v2rayIp" placeholder="127.0.0.1/xxx.com" />
      </el-form-item>
      <el-form-item label="代理端口" prop="clientPort">
        <el-input v-model="postForm.clientPort" />
      </el-form-item>
      <el-form-item label="API端口" prop="v2rayManagerPort">
        <el-input v-model="postForm.v2rayManagerPort" />
      </el-form-item>
      <el-form-item label="SNI域名" prop="clientDomain">
        <el-input v-model="postForm.clientDomain" placeholder="可能与代理地址不同" />
      </el-form-item>
      <el-form-item label="协议属性" prop="protocolField">
        <el-input v-model="postForm.protocolField" type="textarea" :rows="5" placeholder="{&quot;wsPath&quot;:&quot;/ws&quot;}" />
      </el-form-item>
      <el-form-item v-show="fieldVisible" label="inboundTag" prop="inboundTag">
        <el-input v-model="postForm.inboundTag" />
      </el-form-item>
      <el-form-item label="服务描述">
        <el-input v-model="postForm.desc" />
      </el-form-item>

      <el-form-item label="流量倍数" prop="Multiple">
        <el-input v-model="postForm.multiple" placeholder="1" />
      </el-form-item>
      <el-form-item label="服务器等级" prop="level">
        <el-select v-model="postForm.level">
          <el-option
            v-for="item in levelOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>
      <el-form-item label="服务器状态" prop="status">
        <el-select v-model="postForm.status">
          <el-option
            v-for="item in statusOptions"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </el-form-item>

      <el-button v-loading="loading" style="margin-left: 10px;" type="success" @click="submitForm">
        提交
      </el-button>
    </el-form>
  </div>
</template>

<script>
import { addServer, getServer, updateServer } from '@/api/server'
import { getProtocols } from '@/api/config'

const defaultForm = {
  serverName: '',
  clientDomain: '',
  clientPort: 443,
  supportTLS: true,

  // proxy中间件管理 ip port;

  proxyIp: '',
  proxyPort: 8091,
  // v2ray 开放 的 ip 和端口
  v2rayIp: '',
  v2rayPort: 6001,
  v2rayManagerPort: 62789,
  // 流量倍数
  multiple: 1,
  protocol: 'trojan',

  // 说明
  desc: '',
  // 服务器状态
  status: 1,
  level: 0,
  inboundTag: '',
  // 单账号最大连接数
  maxConnection: 100,
  // 与协议相对应的属性
  protocolField: '{}'
}
const defaultRules = {
  serverName: { required: true, trigger: 'blur' },
  clientDomain: { required: true, trigger: 'blur' },
  clientPort: { required: true, trigger: 'blur' },
  supportTLS: { required: true, trigger: 'blur' },

  // proxy中间件管理 ip port;

  // proxyIp: { required: true, trigger: 'blur' },
  // proxyPort: { required: true, trigger: 'blur' },
  // v2ray 开放 的 ip 和端口
  v2rayIp: { required: true, trigger: 'blur' },
  // v2rayPort: { required: true, trigger: 'blur' },
  v2rayManagerPort: { required: true, trigger: 'blur' },
  protocol: { required: true, trigger: 'blur' },
  // 流量倍数
  multiple: { required: true, trigger: 'blur' },

  // 说明
  desc: '',
  // 服务器状态
  status: { required: true, trigger: 'blur' },

  inboundTag: { required: true, trigger: 'blur' },
  // 单账号最大连接数
  // maxConnection:{ required: true, trigger: 'blur' },
  // ws路径
  // wsPath: { required: true, trigger: 'blur' },
  network: { required: true, trigger: 'blur' }
}

export default {
  name: 'ServerDetail',
  props: {
    isEdit: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      postForm: Object.assign({}, defaultForm),
      loading: false,
      rules: Object.assign({}, defaultRules),
      tempRoute: {},
      statusOptions: [{ value: 1, label: '上线' }, { value: 0, label: '下线' }],
      levelOptions: [{ value: 0, label: '等级0' }, { value: 1, label: '等级1' }, { value: 2, label: '等级2' }, {
        value: 3,
        label: '等级3'
      }, {
        value: 4,
        label: '等级4'
      }],
      protocolOptions: [],
      fieldVisible: true
    }
  },
  computed: {},
  created() {
    if (this.isEdit) {
      const id = this.$route.params && this.$route.params.id
      this.fetchData(id)
    }
    getProtocols().then(response => {
      this.protocolOptions = response.obj
    })

    // Why need to make a copy of this.$route here?
    // Because if you enter this page and quickly switch tag, may be in the execution of the setTagsViewTitle function, this.$route is no longer pointing to the current page
    // https://github.com/PanJiaChen/vue-element-admin/issues/1221
    this.tempRoute = Object.assign({}, this.$route)
  },
  methods: {
    fetchData(id) {
      getServer(id).then(response => {
        this.postForm = response.obj
        this.changeProtocol(this.postForm.protocol)
      })
    },
    submitForm() {
      this.$refs.postForm.validate(valid => {
        if (valid) {
          this.loading = true
          var req = this.isEdit ? updateServer(this.postForm) : addServer(this.postForm)
          req.then(response => {
            console.log('addserver chenggong !' + response)
            this.$notify({
              title: '成功',
              message: '提交成功',
              type: 'success',
              duration: 2000
            })
          }).catch(err => {
            console.log(err)
          }).finally(() => {
            this.loading = false
          })
        } else {
          console.log('error submit!!')
          return false
        }
      })
    },
    changeProtocol(protocol) {
      const visible = protocol !== 'hysteria' && protocol !== 'hysteria2'
      this.fieldVisible = visible
      defaultRules.inboundTag.required = visible
    }
  }
}

</script>

<style lang="scss" scoped>
  @import "~@/styles/mixin.scss";

  .createPost-container {
    position: relative;

    .createPost-main-container {
      padding: 40px 45px 20px 50px;

      .postInfo-container {
        position: relative;
        @include clearfix;
        margin-bottom: 10px;

        .postInfo-container-item {
          float: left;
        }
      }
    }

    .word-counter {
      width: 40px;
      position: absolute;
      right: 10px;
      top: 0px;
    }
  }

  .article-textarea {
    textarea {
      padding-right: 40px;
      resize: none;
      border: none;
      border-radius: 0px;
      border-bottom: 1px solid #bfcbd9;
    }
  }
</style>
