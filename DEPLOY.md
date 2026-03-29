# 贷款管家 — 部署指南

## 1. 推送代码到 GitHub

```bash
# 进入项目目录
cd loan-tracker

# 初始化 Git 仓库
git init

# 添加所有文件
git add .

# 创建首次提交
git commit -m "初始化贷款管家 PWA 应用"

# 在 GitHub 上创建一个新仓库（不要勾选 README/gitignore/license）
# 仓库名建议：loan-tracker

# 关联远程仓库（将 <你的用户名> 替换为你的 GitHub 用户名）
git remote add origin https://github.com/<你的用户名>/loan-tracker.git

# 推送代码
git branch -M main
git push -u origin main
```

## 2. 在 Vercel 上部署

1. 打开 [vercel.com](https://vercel.com)，用 GitHub 账号登录
2. 点击 **"Add New Project"**
3. 在 **"Import Git Repository"** 列表中找到 `loan-tracker`，点击 **Import**
4. Vercel 会自动检测到 Vite 框架，无需修改任何构建配置：
   - Framework Preset: **Vite**
   - Build Command: `npm run build`（自动填入）
   - Output Directory: `dist`（自动填入）
5. 点击 **Deploy**，等待构建完成（通常不到 1 分钟）
6. 部署成功后会得到一个网址，如 `https://loan-tracker-xxx.vercel.app`

> 如需自定义域名，在项目 Settings → Domains 中添加。

## 3. 在 iPhone 上添加到主屏幕

1. 用 **Safari** 打开部署后的网址（必须用 Safari，其他浏览器不支持 PWA）
2. 点击底部工具栏的 **分享按钮**（方框+向上箭头的图标）
3. 在弹出菜单中向下滑动，找到并点击 **"添加到主屏幕"**
4. 名称会自动显示"贷款管家"，点击右上角 **"添加"**
5. 主屏幕上会出现蓝色的"贷"字图标

## 4. 使用说明

- **添加到主屏幕后**，点击图标会以全屏模式打开，没有浏览器地址栏，体验接近原生 App
- **离线可用**：首次加载后，即使没有网络也能正常使用
- **数据存储**：所有数据保存在设备本地（localStorage），不会上传到任何服务器
- **数据导出**：在「设置」页面可以导出 CSV 文件作为备份
- **多设备**：数据不会自动同步，每台设备的数据独立

### 日常使用流程

1. 在「账单」页面添加所有贷款信息
2. 每月在「总览」页面勾选已还款项
3. 在「图表」页面查看还款压力和负债走势
4. 在「设置」页面调整提醒天数，定期导出数据备份
