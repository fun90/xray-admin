<template>
  <div class="user-activity">
    <div v-for="(item,index) in list" :key="index" class="post">
      <div class="user-block">
        <img class="img-circle" src="@/assets/logo.png">
        <span class="username text-muted">{{ item.name }}</span>
        <span class="description">{{ item.updateTime | parseTime('{y}-{m}-{d}') }}</span>
      </div>
      <div class="tui-editor-contents" v-html="item.content" />
    </div>
  </div>
</template>

<script>

const avatarPrefix = '?imageView2/1/w/80/h/80'
const carouselPrefix = '?imageView2/2/h/440'
import { listNotice2 } from '@/api/notice'

import 'tui-editor/dist/tui-editor-contents.css' // editor content
export default {
  components: {},
  props: {
    // eslint-disable-next-line vue/require-default-prop
    name: {
      type: String
    }
  },
  data() {
    return {
      carouselImages: [
        'https://wpimg.wallstcn.com/9679ffb0-9e0b-4451-9916-e21992218054.jpg',
        'https://wpimg.wallstcn.com/bcce3734-0837-4b9f-9261-351ef384f75a.jpg',
        'https://wpimg.wallstcn.com/d1d7b033-d75e-4cd6-ae39-fcd5f1c0a7c5.jpg',
        'https://wpimg.wallstcn.com/50530061-851b-4ca5-9dc5-2fead928a939.jpg'
      ],
      avatarPrefix,
      carouselPrefix,
      list: null
    }
  },
  created() {
    listNotice2(this.name).then(response => {
      this.list = response.obj
      this.activeNames = 0
    })
  }
}
</script>

<style lang="scss" scoped>
.user-activity {
  .user-block {

    .username,
    .description {
      display: block;
      margin-left: 50px;
      padding: 2px 0;
    }

    .username{
      font-size: 16px;
      color: #000;
    }

    :after {
      clear: both;
    }

    .img-circle {
      border-radius: 50%;
      width: 40px;
      height: 40px;
      float: left;
    }

    span {
      font-weight: 500;
      font-size: 12px;
    }
  }

  .post {
    font-size: 14px;
    border-bottom: 1px solid #d2d6de;
    margin-bottom: 15px;
    padding-bottom: 15px;
    color: #666;

    .image {
      width: 100%;
      height: 100%;

    }

    .user-images {
      padding-top: 20px;
    }
  }

  .list-inline {
    padding-left: 0;
    margin-left: -5px;
    list-style: none;

    li {
      display: inline-block;
      padding-right: 5px;
      padding-left: 5px;
      font-size: 13px;
    }

    .link-black {

      &:hover,
      &:focus {
        color: #999;
      }
    }
  }

}

.box-center {
  margin: 0 auto;
  display: table;
}

.text-muted {
  color: #777;
}
</style>
