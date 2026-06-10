# LEONPHOTO

Leon Wang 的个人摄影作品集与生活随笔网站。项目以摄影展示为核心，同时保留成长感受、城市片段、留言互动和后台内容管理能力。

当前版本：`v1.2.0`

## 项目定位

LEONPHOTO 不是传统博客模板，而是一个偏摄影展陈气质的个人站点。首页使用沉浸式封面图，人像、风光、美食以作品集方式呈现，随笔区用于承载生活片段、成长感受和摄影思考。

后台提供照片、随笔、留言、站点资料和首页封面图管理，适合长期维护个人作品与文字。

## 核心功能

- 摄影作品集：人像、风光、美食分类展示，支持精选作品和灯箱浏览。
- 作品组：可将同一次拍摄或同一主题整理为独立作品组，支持组封面、详情页与分享。
- 高清图片策略：缩略图、高清预览图、可选原图三档生成，兼顾加载速度和摄影细节。
- 批量上传：后台支持多张照片上传到同一分类和作品组，可选择是否保留原图。
- 拖拽排序：后台照片支持拖动排序，也提供上移/下移按钮方便移动端操作。
- 首页封面：后台可单独设置首页封面图，不依赖作品列表第一张图。
- 随笔系统：生活、成长、摄影思考等内容通过标签归类展示。
- 留言系统：访客留言和图片分享默认进入审核队列，后台审核后公开。
- 访问统计：真实访问计数和 GitHub 风格访问热力图。
- SEO 基础：内置 `sitemap.xml` 和 `robots.txt`。
- Docker 部署：包含 PostgreSQL、Next.js App、Nginx/Caddy 配置。

## 技术栈

- Next.js `16.2.7`
- React `19.2.4`
- TypeScript
- Tailwind CSS v4
- Prisma `6.19.3`
- PostgreSQL 16
- Sharp 图片处理
- Jose JWT 鉴权
- Docker Compose

## 快速启动

本地开发：

```bash
npm install
npm run dev
```

访问：

```text
http://localhost:3000
```

Docker 启动：

```bash
docker compose up -d --build
```

默认访问：

```text
http://localhost
```

后台入口：

```text
http://localhost/admin
```

## 默认配置

Docker Compose 中提供了默认值，方便本地直接启动：

```text
ADMIN_USERNAME=admin
ADMIN_PASSWORD=dailywang2026!@#
POSTGRES_PASSWORD=sqlwly2026!@#
JWT_SECRET=sqlwly2026!@#
```

生产环境建议使用 `.env` 覆盖这些默认值，尤其是 `ADMIN_PASSWORD`、`POSTGRES_PASSWORD` 和 `JWT_SECRET`。

常用环境变量：

```text
DATABASE_URL=postgresql://photography:<password>@postgres:5432/liyang_photo
JWT_SECRET=<your-secret>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<your-password>
POSTGRES_PASSWORD=<your-db-password>
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## 图片处理策略

后台照片上传后会生成三类资源：

- 缩略图：`480px` WebP，用于列表和网格展示。
- 高清预览图：最长边 `2560px` WebP，质量 `86`，用于灯箱浏览。
- 原图：可选保留，用于灯箱中的“下载原图”按钮。

留言和首页封面上传不会默认保留原图，避免无意义占用空间。

## 后台管理

后台主要入口：

- `/admin`：留言审核。
- `/admin/photos`：照片上传、编辑、分类、排序。
- `/admin/blog`：随笔撰写与发布。
- `/admin/settings`：个人资料和首页封面图。

安全边界：

- 公开留言接口只能查询已审核内容。
- 上传接口需要管理员 token。
- 登录接口带有基础限流。
- 分类删除会检查是否仍有照片使用，避免误删。

## 常用命令

```bash
npm run lint
npm run build
npm run prisma:generate
npm run prisma:push
```

查看 Docker 服务：

```bash
docker compose ps
```

重建并启动：

```bash
docker compose up -d --build
```

## 项目结构

```text
src/app                 Next.js App Router 页面和 API
src/components          前台和后台 UI 组件
src/lib                 Prisma、鉴权、图片处理、分类等工具
prisma/schema.prisma    数据模型
scripts/init.js         Docker 启动时的数据表初始化脚本
public                  静态资源
nginx/default.conf      Nginx 配置
docker-compose.yml      本地 Docker 编排
docker-compose.prod.yml 生产部署参考
```

## 版本记录

### v1.2.0

- 新增作品组数据模型，可按一次拍摄、人物或主题组织照片。
- 新增后台作品组管理，支持分类、描述、地点、日期、排序、发布状态和组封面设置。
- 照片编辑与批量上传支持直接归入作品组。
- 前台分类页面支持在“按作品组查看”和“查看全部照片”之间切换。
- 新增沉浸式作品组详情页，并支持整组链接分享。
- 删除作品组时保留组内照片；删除封面照片时自动回退到组内第一张。
- Docker 启动脚本自动迁移作品组表和照片归组字段，现有照片保持未分组。

### v1.1.0

- 新增照片点赞与取消点赞功能，点赞计数持久化保存。
- 每个浏览器对每张照片保留独立点赞状态，避免刷新重复计数。
- 新增照片分享按钮，支持系统分享面板与复制分享链接。
- 分享链接可自动定位并打开对应照片。
- Docker 启动时自动创建点赞字段和点赞记录表。

### v1.0.0

- 完成摄影展示站视觉重构，采用沉浸式首页和摄影作品集布局。
- 将博客重构为“生活随笔”，支持生活、成长、摄影思考等内容归类。
- 新增独立首页封面图设置。
- 新增真实访问统计和访问热力图。
- 新增照片三档图片策略、原图下载、批量上传和后台排序。
- 新增后台站点设置入口、移动端适配和管理界面优化。
- 收紧留言、上传、登录相关安全边界。
- 新增 `sitemap.xml`、`robots.txt` 和 Docker 构建优化。
