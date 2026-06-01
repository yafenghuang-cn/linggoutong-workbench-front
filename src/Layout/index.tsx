import React from "react";
import { Outlet } from "@tanstack/react-router";
import classNames from "classnames/bind";
import { Layout } from "antd";
import Sidebar from "./Sidebar";
import useAppLayouts from "./hooks/useAppLayouts";
import styles from "@/styles/appLayout.module.scss";
const { Content } = Layout;
const cx = classNames.bind(styles);

const RootLayout: React.FC = () => {
  const { menuItems } = useAppLayouts();
  return (
    <Layout className={cx("app-layout")}>
      <Sidebar menuItems={menuItems} />
      <Layout className={cx("app-layout-content")}>
        <Content className={cx("app-layout-content-main")}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default RootLayout;
