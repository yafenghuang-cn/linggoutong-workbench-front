import type React from "react";
import { memo } from "react";
import { MenuUnfoldOutlined, MenuFoldOutlined } from "@ant-design/icons";
import { Layout, Menu, Button } from "antd";
import classNames from "classnames/bind";
import type { MenuProps } from "antd";
import useSidebar from "./hooks/useSidebar";
import styles from "@/styles/Sidebar.module.scss";

const cx = classNames.bind(styles);
const { Sider } = Layout;

interface IMenuProps {
  menuItems: NonNullable<MenuProps["items"]>;
}

const SideMenuContent: React.FC<IMenuProps> = (props) => {
  const { menuItems } = props;
  const { collapsed, handleCollapse, selectedKeys, openKeys, handleMenuClick, handleOpenChange } = useSidebar();

  return (
    <Sider
      className={cx("side")}
      collapsed={collapsed}
      collapsedWidth={80}
      collapsible
      theme="dark"
      trigger={null}
      width={256}
    >
      <div className={cx("sideInner")}>
        <div className={cx("sideLogo", { siderLogoCollapsed: collapsed })}>
          <span className={cx("sideLogoMark")}>LX</span>
          {!collapsed && <span className={cx("sideLogoTitle")}>灵犀工作台</span>}
        </div>

        <div className={cx("sideMenuWrap")}>
          <Menu
            className={cx("sideMenu")}
            inlineCollapsed={collapsed}
            items={menuItems}
            mode="inline"
            openKeys={collapsed ? [] : openKeys}
            selectedKeys={selectedKeys}
            theme="dark"
            onClick={handleMenuClick}
            onOpenChange={handleOpenChange}
          />
        </div>

        <div className={cx("sideFooter", { siderFooterCollapsed: collapsed })}>
          <Button
            block
            className={cx("sideCollapseBtn")}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            type="text"
            onClick={handleCollapse}
          />
        </div>
      </div>
    </Sider>
  );
};

export default memo(SideMenuContent);
