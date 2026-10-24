# 部署指南 · 1500 米之后

> 当前线上地址：<https://berrr-star.github.io/1500m-after/>（GitHub Pages，仓库 <https://github.com/berrr-star/1500m-after>）。日常更新在该仓库 `main` 分支 push 即可自动重新部署。

站点是**纯静态**页面：没有后端、没有数据库、没有构建步骤，所有资源都是本地相对路径。把 `portfolio/` 里的文件原样放到任意静态托管上即可。

## 先选一个方案

| 方案 | 难度 | 费用 | 国内访问 | 自定义域名 |
| --- | --- | --- | --- | --- |
| Netlify Drop（拖拽上传） | 最低 | 免费 | 一般，可配 CDN | 支持 |
| GitHub Pages | 低 | 免费 | 一般 | 支持 |
| 腾讯云 COS / EdgeOne Pages / 阿里云 OSS | 中 | 低（按量/免费额度） | 好 | 支持（大陆域名需备案） |
| 自己的服务器（Nginx） | 中 | 服务器费用 | 取决于服务器 | 支持 |

> 第一次上线建议先走 **Netlify Drop**，不登录也能拿到一个 https 链接；确定长期使用后再迁移到 GitHub Pages 或国内云。

## 方案 A：Netlify Drop（最快，1 分钟）

1. 打开 <https://app.netlify.com/drop>
2. 把整个 `portfolio` 文件夹拖进页面（不要只拖压缩包里的单个 html；文件夹根目录要有 `index.html`）。
3. 等几秒，会得到一个 `https://随机名.netlify.app` 的网址。
4. 想保留站点 / 以后更新：点 Claim site 登录 Netlify（可用 GitHub 账号），之后把 site 关联到这个文件夹即可。
5. 自定义域名：Site settings → Domain management → Add custom domain，再按提示加 DNS 记录。

> 上传体积约 2 MB（主要是 Three.js 和降级图）。`assets/preview/`、`README.md`、`CONTENT.md` 对线上不影响，可选删除。

## 方案 B：GitHub Pages（免费长期 + 可版本管理）

在 `portfolio` 目录单独建仓库，**不要**把整个「网站设计」工作区推上去，避免其他项目一起公开。

```bash
cd "/Users/hongshibo/Documents/网站设计/portfolio"
git init -b main
git add .
git commit -m "deploy: 1500 米之后"

# 方式 1：有 GitHub CLI 且已登录（gh auth login）
gh repo create 1500m-after --public --source=. --remote=origin --push

# 方式 2：先在 github.com 新建空仓库，再：
# git remote add origin https://github.com/<你的用户名>/1500m-after.git
# git push -u origin main
```

然后把仓库 **Settings → Pages → Build and deployment** 设为：
- Source: `Deploy from a branch`
- Branch: `main` / 目录 `/(root)`

几十秒后访问 `https://<你的用户名>.github.io/1500m-after/`。仓库里已有 `.nojekyll`，不会被 Jekyll 处理。以后更新：

```bash
cd "/Users/hongshibo/Documents/网站设计/portfolio"
git add -A && git commit -m "update" && git push
```

## 方案 C：国内云静态托管（访问速度优先）

以 **腾讯云 COS 静态网站** 为例（阿里云 OSS 的「静态页面」设置类似）：

1. 登录云控制台 → 对象存储 → 创建存储桶：地域选就近（如广州/上海），访问权限选「公有读私有写」。
2. 把 `portfolio` 里的文件按原目录结构上传到存储桶根目录（`index.html` 必须在根目录）。
3. 基础配置 → 静态网站 → 开启，索引文档填 `index.html`。
4. 用控制台给出的静态网站端点访问；建议再绑定自定义域名 + CDN，并在 CDN 上开启 HTTPS。
5. 如果使用中国大陆节点 + 自己的域名，需要先完成 **ICP 备案**；只用云厂商提供的默认测试域名可以先看效果。

> 想省掉手动上传：用 `coscmd` / `ossutil` / `rclone` 命令行同步，或直接用 GitHub Actions 自动上传。

## 方案 D：自己的服务器 / 已有域名

```bash
# 从 Mac 上传到服务器（先确保服务器有 Web 目录）
rsync -avz --delete "/Users/hongshibo/Documents/网站设计/portfolio/" user@你的服务器:/var/www/1500m/
```

Nginx 站点配置（`/etc/nginx/conf.d/1500m.conf`）：

```nginx
server {
    listen 80;
    server_name 你的域名;

    root /var/www/1500m;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location ~* \.(css|js|woff2|svg|jpg|png)$ {
        expires 30d;
        add_header Cache-Control "public";
    }
}
```

然后 `nginx -t && systemctl reload nginx`。HTTPS 用 `certbot --nginx -d 你的域名` 一条命令即可。

## 方案 E：先给同 Wi‑Fi 的手机看（不花钱）

```bash
cd "/Users/hongshibo/Documents/网站设计/portfolio"
python3 -m http.server 8080 --bind 0.0.0.0
```

同一 Wi‑Fi 下，手机浏览器打开 `http://192.168.3.31:8080/`（IP 变了就 `ipconfig getifaddr en0` 重新查）。注意这只在运行命令的电脑开着时有效。

## 部署包

根目录已生成 `1500米之后-部署包.zip`（只含线上必需文件，约 1 MB，解压后根目录就是 `index.html`）。适合只支持压缩包上传的平台，或发给别人代为部署。

## 上线前检查清单

- [ ] 访问首页是蓝色 3D 首屏，三个按钮能滚动/跳转（手机上也试一下）。
- [ ] 三个子页可以直接打开（`/experience.html` 等）。
- [ ] 控制台没有 404 / 报错；字体和 3D 正常。
- [ ] 用 https 访问（Netlify / Vercel / GitHub Pages 自动提供；自建服务器用 certbot）。
- [ ] 如使用自定义域名：DNS 解析正确、国内域名已备案。
- [ ] 站点没有姓名/联系方式等隐私内容（当前没有）；以后要加再补。
- [ ] 以后修改页面：重新上传文件夹或 push 一次即可；无构建命令。
