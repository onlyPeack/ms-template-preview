<template>
    <div style="background-color: #fff;" class="temp-preview">
        <div style="position:relative;overflow: hidden;min-height: 400px" class="temp-preview-contain">
            <div style="width: 100%;" v-for="(item,index) in plugs" v-bind:key="index">
                <component :is="item" ref="msHead"></component>
            </div>
        </div>
    </div>
</template>

<script>
    import {
        listForWeb,
        webTree as page,
        selectByUrl
    } from '@/api/temp/columnControl';
    import {columnType, tempType} from "./common/dic";
    import {getObj} from '@/api/temp/articleControl'

    export default {
        name: "bigPreview",
        data() {
            return {
                plugs: [],
                nowIndex: 0,
                isSingle: false,//是否单选模板
                isShowPanel: false,//是否展示设置面板
                isShowMainPanel: true,//是否展示主体设置面板
                isShowArticleSelector: false,//是否展示文章关联弹窗
                isShowTempSelector: false,//是否展示模板选择弹窗
                isShowPageSelector: false,//是否展示网页选择弹窗
                chooseTemp: [],//已关联的模板
                moduleStyle: {},//当前模板样式&文案
                webPageList: [],//当前租户下创建的所有网页
                chooseArticle: {},//当前选择的文章集合
                chooseDetailPage: {},//当前文章关联的详情页
                articleDetail: {},//文章详情存储
                tenantId: '',//当前租户ID
                columnType,
                tempType,
                // articleList:[],//当前文章列表

            }
        },
        created() {
            selectByUrl(window.location.hostname).then(res => {
                if (Number(res.data.code) === 2000 || Number(res.data.code) === 200) {
                    this.tenantId = res.data.data.tenant
                    page({tenantId: this.tenantId}).then(resp => {
                        this.webDataChange(resp.data)
                        this.webPageList = resp.data
                        this.getDetail()
                    })
                } else {
                    this.$message.error('查询租户失败!' + res.data.data || res.data.msg)
                }
            }, error => this.$message.error('查询租户失败!' + error))
        },
        watch: {
            '$route': function () {
                this.getDetail()
                // console.log('监听到变化')
            },
        },
        methods: {
            getDetail() {
                //初次进入默认读取排序第一网页
                let id = this.$route.query.id || this.webPageList[0].id

                if (this.$route.query.article && this.$route.query.article !== '') {
                    getObj(this.$route.query.article).then(res => {
                        this.articleDetail = res.data.data
                        console.log(this.articleDetail, 'articleDetail')
                    }, error => this.$message.error('获取文章详情失败!' + error))
                }

                listForWeb({id, tenantId: this.tenantId}).then(res => {
                    try {
                        this.chooseTemp = res.data
                        this.chooseTemp.sort(this.sortData)
                        let temp = []
                        for (let i = 0; i < this.chooseTemp.length; i++) {
                            temp.push(this.chooseTemp[i].name)
                        }
                        console.log(temp, 'id')
                        this.plugs = temp
                        this.$nextTick(() => {
                            this.moduleCompute()
                        })

                        //console.log(this.plugs,'temp')
                    } catch (e) {
                        console.log('模板加载错误', e)
                    }


                }, error => this.$message.error('查询网页模板失败!' + error))


            },

            testBtn(params) {
                console.log(params, 'params')
            },
            uploadImg(res, file) {
                this.$set(this.moduleStyle.style[this.nowIndex], 'value', res.data.url)
            },
            moduleAdd() {

            },
            /**
             * 所有对话框关闭事件
             */
            handleClosePublic() {
                this.isShowTempSelector = false
                this.isShowArticleSelector = false
                this.isShowPageSelector = false
            },

            showTempSelector() {
                this.isSingle = false
                this.isShowTempSelector = true
            },

            insertTemp(row, index, flag) {
                this.isSingle = true
                this.isShowTempSelector = true
                this.nowIndex = flag === 'before' ? index : index + 1

            },

            sortData(a, b) {
                return a.sort - b.sort
            },

            /**
             * 重新设置每个模板的module
             */
            moduleCompute() {
                if (this.$refs.msHead && this.$refs.msHead.length > 0) {
                    for (let i = 0; i < this.$refs.msHead.length; i++) {
                        let style = {}
                        let module = this.$refs.msHead[i].getModule()
                        if (this.chooseTemp[i].style && this.chooseTemp[i].style.length > 0) {
                            style = JSON.parse(this.chooseTemp[i].style)
                        }
                        // if (this.chooseTemp[i].articleList && this.chooseTemp[i].articleList.length > 0) {
                        //     console.log('enter')
                        //     style.article = this.chooseTemp[i].articleList[0].children
                        //     for (let j = 0; j < style.article.length; j++) {
                        //         style.article[j].link = `/bigPreview?id=${this.chooseTemp[i].did}&article=${style.article[j].id}`
                        //         console.log('__________________')
                        //         console.log(style.article[j].link,'enter')
                        //     }
                        //     this.chooseArticle = this.chooseTemp[i].articleList[0]
                        // }
                        if (this.chooseTemp[i].articleList && this.chooseTemp[i].articleList.length > 0) {
                            style.article = this.chooseTemp[i].articleList[0].children
                            for (let j = 0; j < style.article.length; j++) {
                                style.article[j].link = `/bigPreview?id=${this.chooseTemp[i].did}&article=${style.article[j].id}`
                            }
                            this.chooseArticle = this.chooseTemp[i].articleList[0]||{}
                        }
                        if (Object.prototype.toString.call(module.text) === '[object Array]') {
                            for (let j = 0; j < module.text.length; j++) {

                                if (module.text[j].type && module.text[j].type === 'nav') {
                                    module.text[j].children = this.webPageList
                                }else{
                                    module.text[j].children = style.text[j].children
                                }
                            }
                            style.text = module.text

                        }

                        //如果为详情模板则传入文章详情
                        if (this.tempType[this.chooseTemp[i].type] === '详情模板' && this.articleDetail.id) {
                            style.detail = this.articleDetail
                        }
                        this.$refs.msHead[i].setModule(style)
                        console.log(style, 'submitList', this.webPageList, this.$refs.msHead[i].getModule())

                    }
                    // console.log(this.$refs.msHead[0].getModule(), '拖拽发生了变化')
                }
            },

            webDataChange(data) {
                for (let i = 0; i < data.length; i++) {
                    data[i].label = data[i].name
                    data[i].link = `/#/bigPreview?id=${data[i].id}`
                    if (data[i].children && data[i].children.length > 0) {
                        this.webDataChange(data[i].children)
                    }
                }
            }
        }
    }
</script>
<style scoped>

    .temp-preview-aside {
        height: 100%;
        width: 20%;
        padding-top: 20px;
        vertical-align: top;
        display: inline-block;
        text-align: center;
    }

    >>> .temp-preview-aside .temp-preview-aside-text-setting .el-form-item {
        margin-bottom: 0 !important;
    }
</style>
<style>
    .avatar-uploader .el-upload {
        border: 1px dashed #d9d9d9;
        border-radius: 6px;
        cursor: pointer;
        position: relative;
        overflow: hidden;
    }

    .avatar-uploader .el-upload:hover {
        border-color: #409EFF;
    }

    .avatar-uploader-icon {
        font-size: 28px;
        color: #8c939d;
        width: 148px !important;
        height: 148px !important;
        line-height: 148px !important;
        text-align: center;
    }

    .avatar {
        width: 148px !important;
        height: 148px !important;
        display: block;
    }


    .el-tabs__content {
        height: 100% !important;
    }

    .el-tab-pane {
        height: calc(100% - 55px) !important;
        overflow-y: scroll;
    }

    .avue-draggable {
        z-index: 2000 !important;
    }

    #app {
        overflow: unset;
    }
</style>

