import { MinusOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Input, Modal } from 'antd';
import React, { useMemo, useState } from 'react';
import styles from '../index.less';

type PackageOption = {
  key: string;
  title: string;
  price: number;
  oldPrice: number;
};

type Props = {
  open: boolean;
  poolName?: string;
  onClose: () => void;
};

const packageOptions: PackageOption[] = [
  { key: '100', title: '100分钟语音池加油包', price: 100, oldPrice: 100 },
  { key: '500', title: '500分钟语音池加油包', price: 500, oldPrice: 500 },
  { key: '1000', title: '1000分钟语音池加油包', price: 1000, oldPrice: 1000 },
  { key: '10000', title: '10000分钟语音池加油包', price: 10000, oldPrice: 10000 },
  { key: '100000', title: '100000分钟语音池加油包', price: 100000, oldPrice: 100000 },
];

const OrderVoicePackageModal: React.FC<Props> = ({ open, poolName, onClose }) => {
  const { message } = App.useApp();
  const [selectedKey, setSelectedKey] = useState<string>();
  const [count, setCount] = useState(1);
  const selectedPackage = useMemo(
    () => packageOptions.find((item) => item.key === selectedKey),
    [selectedKey],
  );

  const totalPrice = selectedPackage ? selectedPackage.price * count : 0;

  return (
    <Modal
      destroyOnHidden
      open={open}
      title="订购语音包"
      width={920}
      footer={null}
      onCancel={onClose}
    >
      <Input.TextArea
        className={styles.modalHint}
        autoSize={{ minRows: 1, maxRows: 2 }}
        readOnly
        value={`订购即生效，有效期至订购当月月末，可重复订购。${
          poolName ? ` 当前池：${poolName}` : ''
        }`}
      />

      <div className={styles.packageGrid}>
        {packageOptions.map((item) => {
          const active = selectedKey === item.key;
          return (
            <div
              key={item.key}
              className={`${styles.packageCard} ${active ? styles.packageCardActive : ''}`}
              onClick={() => setSelectedKey(item.key)}
            >
              <input
                checked={active}
                className={styles.packageCheck}
                readOnly
                type="radio"
              />
              <div className={styles.packageTitle}>{item.title}</div>
              <div className={styles.packagePriceRow}>
                <span className={styles.packagePrice}>￥{item.price}</span>
                <span className={styles.packageOldPrice}>原价：￥{item.oldPrice}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className={styles.quantityRow}>
        <span>数量：</span>
        <Button
          disabled={count <= 1}
          icon={<MinusOutlined />}
          onClick={() => setCount((value) => Math.max(1, value - 1))}
        />
        <Input readOnly style={{ width: 96, textAlign: 'center' }} value={count} />
        <Button icon={<PlusOutlined />} onClick={() => setCount((value) => value + 1)} />
      </div>

      <div className={styles.summaryRow}>
        <div>
          合计 <span className={styles.summaryPrice}>￥{totalPrice}</span>
        </div>
        <div>
          <Button
            style={{ marginRight: 12 }}
            type="primary"
            onClick={() => message.info('支付功能即将开放，请联系客户经理')}
          >
            余额支付
          </Button>
          <Button
            type="primary"
            onClick={() => message.info('支付功能即将开放，请联系客户经理')}
          >
            在线支付
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default OrderVoicePackageModal;