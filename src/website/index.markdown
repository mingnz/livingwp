---
# Feel free to add content and custom Front Matter to this file.
# To modify the layout, see https://jekyllrb.com/docs/themes/#overriding-theme-defaults

layout: home
---

<style>
.homepage-img-right {
  float: right;
  margin-left: 20px;
  width: 220px;
}
.homepage-img-right img {
  width: 100%;
}
@media (max-width: 700px) {
  .homepage-img-right {
    float: none !important;
    display: block;
    margin: 0 auto 20px auto !important;
    width: 90% !important;
    max-width: 320px;
  }
}
</style>

<div class="homepage-img-right">
  <img src="assets/ainz.jpg" alt="AI in NZ">
</div>

Discover how generative AI is shaping industries across Aotearoa. This website is a living resource, automatically updated by an autonomous agent that scans the web for the latest insights and sector trends.

**Explore the Living Whitepaper:**

{% include article_list.md %}

Curious about the process? [Learn how it works](how-it-works)

Your contributions are invaluable—join us on [GitHub](https://github.com/mingnz/livingwp) and help shape the future of AI in New Zealand.
