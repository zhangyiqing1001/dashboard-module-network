import { LB_LISTENEER_ACTION_POLICIES } from '@Network/constants/lb'
import * as R from 'ramda'
import { PROVIDER_MAP } from '@/constants'

export default {
  created () {
    this.singleActions = [
      {
        label: '更改',
        permission: 'lb_loadbalancerlisteners_update',
        action: obj => {
          const query = {
            type: this.data.provider,
            listener: obj.id,
          }
          if (query.type === 'Aws') {
            query.spec = this.list ? this.data.loadbalancer_spec : this.detailData.loadbalancer_spec
          }
          this.$router.push({
            path: `/lb/${obj.loadbalancer_id}/listener-update`,
            query,
          })
        },
      },
      {
        label: '删除',
        permission: 'lb_loadbalancerlisteners_delete',
        action: (obj) => {
          this.createDialog('DeleteResDialog', {
            vm: this,
            title: '删除',
            name: '监听',
            data: [obj],
            columns: this.columns,
            onManager: this.onManager,
          })
        },
        meta: obj => this.$getDeleteResult(obj),
      },
      {
        label: '更多',
        actions: row => [
          {
            label: '调整访问控制',
            permission: 'lb_loadbalancerlisteners_update',
            action: (obj) => {
              this.createDialog('LbListenerUpdateAclDialog', {
                vm: this,
                data: [obj],
                columns: this.columns,
                onManager: this.onManager,
              })
            },
            meta: ({ enabled }) => {
              return this.getActionMeta(!enabled, row, 'aclUpdate')
            },
          },
          {
            label: '启用',
            permission: 'lb_loadbalancerlisteners_enable',
            action: (row) => {
              this.onManager('performAction', {
                id: row.id,
                managerArgs: {
                  action: 'enable',
                },
              })
            },
            meta: ({ enabled }) => {
              return this.getActionMeta(!enabled, row, 'enable')
            },
          },
          {
            label: '禁用',
            permission: 'lb_loadbalancerlisteners_disable',
            action: (row) => {
              this.onManager('performAction', {
                id: row.id,
                managerArgs: {
                  action: 'disable',
                },
              })
            },
            meta: ({ enabled }) => {
              return this.getActionMeta(enabled, row, 'disable')
            },
          },
          {
            label: '启用健康检查',
            permission: 'lb_loadbalancerlisteners_udpate',
            action: (row) => {
              this.onManager('update', {
                id: row.id,
                managerArgs: {
                  data: { health_check: 'on' },
                },
              })
            },
            meta: (row) => {
              return this.getActionMeta(row.health_check === 'off', row, 'enableHealthCheck')
            },
          },
          {
            label: '停用健康检查',
            permission: 'lb_loadbalancerlisteners_udpate',
            action: (row) => {
              this.onManager('update', {
                id: row.id,
                managerArgs: {
                  data: { health_check: 'off' },
                },
              })
            },
            meta: (row) => {
              return this.getActionMeta(row.health_check === 'on', row, 'disableHealthCheck')
            },
          },
        ],
      },
    ]
  },
  methods: {
    getActionMeta (condition, row, action) {
      const providerItem = LB_LISTENEER_ACTION_POLICIES[row.provider.toLowerCase()]
      if (providerItem) {
        if ((R.is(Function, providerItem[action]) && providerItem[action](row) === false) || providerItem[action] === false) {
          return {
            validate: false,
            tooltip: `【${PROVIDER_MAP[row.provider].label}】暂不支持该操作`,
          }
        }
      }
      if (!condition) return { validate: false }
      return { validate: true }
    },
  },
}