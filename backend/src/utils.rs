use anyhow::{Result, anyhow};
use scraper::{Html, Selector};
use std::fs;
use std::hash::{DefaultHasher, Hash, Hasher};
use std::path::Path;
use tauri_plugin_http::reqwest::Client as HttpClient;

pub fn hash<T: Hash>(value: &T) -> u64 {
    let mut hasher = DefaultHasher::new();
    value.hash(&mut hasher);
    hasher.finish()
}

pub trait HtmlExt {
    fn text_content(&self, selector: impl AsRef<str>) -> Result<String>;
    fn attr(&self, selector: impl AsRef<str>, name: impl AsRef<str>) -> Result<String>;
}

pub trait StrExt {
    fn to_hash(&self) -> u64;
    fn to_selector(&self) -> Result<Selector>;
    async fn get_html(&self, http_client: &HttpClient) -> Result<Html>;
}

impl StrExt for str {
    fn to_hash(&self) -> u64 {
        hash(&self)
    }

    fn to_selector(&self) -> Result<Selector> {
        Selector::parse(self)
            .map_err(|err| anyhow!("failed to parse selector from string: {self}. error: {err}"))
    }

    async fn get_html(&self, http_client: &HttpClient) -> Result<Html> {
        let html = http_client.get(self).send().await?.text().await?;
        Ok(Html::parse_document(&html))
    }
}

impl HtmlExt for Html {
    fn text_content(&self, selector: impl AsRef<str>) -> Result<String> {
        let selector = selector.as_ref().to_selector()?;

        self.select(&selector)
            .next()
            .map(|x| x.text().collect())
            .ok_or_else(|| anyhow!("failed to find text content for selector: {selector:?}"))
    }

    fn attr(&self, selector: impl AsRef<str>, name: impl AsRef<str>) -> Result<String> {
        let selector = selector.as_ref().to_selector()?;
        let name = name.as_ref();

        self.select(&selector)
            .next()
            .and_then(|x| x.value().attr(name))
            .map(|x| x.to_string())
            .ok_or_else(|| anyhow!("failed to find attribute: {name} for selector: {selector:?}"))
    }
}

pub trait HttpClientExt {
    async fn download(&self, url: impl AsRef<str>, path: impl AsRef<Path>) -> Result<()>;
}

impl HttpClientExt for HttpClient {
    async fn download(&self, url: impl AsRef<str>, path: impl AsRef<Path>) -> Result<()> {
        let url = url.as_ref();
        let path = path.as_ref();
        let res = self.get(url).send().await?;

        fs::write(path, res.bytes().await?).map_err(|err| {
            anyhow!(
                "failed to download: {url} to: {}. error: {err}",
                path.display()
            )
        })?;

        Ok(())
    }
}
