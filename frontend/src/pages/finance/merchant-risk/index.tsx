import { PageContainer } from '@ant-design/pro-components';
import React from 'react';
import styles from './index.less';

const MerchantRiskPage: React.FC = () => {
  return (
    <PageContainer
      className={styles.merchantRiskPage}
      header={{
        title: '商户与风控',
        subTitle: '统一查看支付商户注册状态、渠道开通情况和商户风控信息。',
      }}
    >
      <div className={styles.heroCard}>
        <div className={styles.heroTitle}>开始支付商户注册验证流程</div>
        <div className={styles.heroDesc}>
          独立支付功能需要完成第三方支付平台的认证，认证审核通过后还需要完善资料，完善资料后即可使用完整的独立支付功能。
        </div>
      </div>

      <div className={styles.contentCard}>
        <div className={styles.contentGrid}>
          <div>
            <div className={styles.sectionTitle}>商户资料</div>
            <div className={styles.infoGrid}>
              {[
                ['商户注册状态', '已注册'],
                ['支付方式开通', '等待开通'],
                ['支付宝开通状态', '未开通'],
                ['微信开通状态', '未开通'],
                ['服务有效期', '未开通'],
                ['优惠时间段', '未开通'],
              ].map(([label, value]) => (
                <div className={styles.infoItem} key={label}>
                  <div className={styles.infoLabel}>{label}</div>
                  <div className={styles.infoValue}>{value}</div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className={styles.sectionTitle}>银盛账号信息</div>
            <div className={styles.infoGrid}>
              {[
                ['826商户号', 'QRY250716863113'],
                ['商户名称', '广东聚晨晋力通信设备科技有限公司'],
                ['价格策略', '标准价格策略（待确认）'],
                ['交易风控', '正常，无高风险交易拦截'],
              ].map(([label, value]) => (
                <div className={styles.infoItem} key={label}>
                  <div className={styles.infoLabel}>{label}</div>
                  <div className={styles.infoValue}>{value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </PageContainer>
  );
};

export default MerchantRiskPage;
