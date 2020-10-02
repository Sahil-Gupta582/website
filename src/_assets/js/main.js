//= require vendor/jquery-3.3.1
//= require popper
//= require bootstrap
//= require archive.js
//= require tabs.js
//= require vendor/code-prettify/prettify
//= require vendor/code-prettify/lang-css
//= require vendor/code-prettify/lang-dart
//= require vendor/code-prettify/lang-yaml

// TODO(chalin): find a way to selectively generate (as individual files) and then include archive.js and/or tabs.js

$(function () {
  adjustToc();
  initFixedColumns();
  initVideoModal();
  initCarousel();
  initSnackbar();

  addCopyCodeButtonsEverywhere(); // Must be before tooltip activation.
  $('[data-toggle="tooltip"]').tooltip();
  setupClipboardJS();

  // New (dash) tabs
  setupTabs($('#editor-setup'), 'io.flutter.tool-id');
  setupTabs($('.sample-code-tabs'), 'io.flutter.tool-id');
  // Old tabs
  setupToolsTabs($('#tab-set-install'), 'tab-install-', 'io.flutter.tool-id');
  setupToolsTabs($('#tab-set-os'), 'tab-os-', null, getOS());

  prettyPrint();
});

// TODO(chalin): Copied (& tweaked) from site-www, consider moving into site-shared
function adjustToc() {
  // Adjustments to the jekyll-toc TOC.

  const tocId = '#site-toc--side';
  const tocWrapper = $(tocId);
  $(tocWrapper).find('.site-toc--button__page-top').click(function () {
    $('html, body').animate({ scrollTop: 0 }, 'fast');
  })

  $('body').scrollspy({ offset: 100, target: tocId });
}

function initFixedColumns() {
  const fixedColumnsSelector = '[data-fixed-column]';
  const bannerSelector = '.site-banner';
  const footerSelector = 'footer.site-footer';
  const headerSelector = '.site-header';
  const fixedColumns = $(fixedColumnsSelector);

  function adjustFixedColumns() {
    // only change values if the fixed col is visible
    if ($(fixedColumnsSelector).css('display') == 'none') {
      return;
    }

    const headerHeight = $(headerSelector).outerHeight();
    const bannerHeight = $(bannerSelector).outerHeight();
    const bannerOffset = $(bannerSelector).offset().top;
    const bannerPosition = bannerOffset - $(window).scrollTop();
    const bannerVisibleHeight = Math.max(bannerHeight - (headerHeight - bannerPosition), 0);
    const topOffset = headerHeight + bannerVisibleHeight;

    const footerOffset = $(footerSelector).offset().top;
    const footerPosition = footerOffset - $(window).scrollTop();
    const footerVisibleHeight = $(window).height() - footerPosition;

    const fixedColumnsMaxHeight = $(window).height() - topOffset - footerVisibleHeight;

    $(fixedColumnsSelector).css('max-height', fixedColumnsMaxHeight);
    $(fixedColumnsSelector).css('top', topOffset);
  }

  if (fixedColumns.length) {
    $(fixedColumnsSelector).css('position', 'fixed');

    // listen for scroll and execute once
    $(window).scroll(adjustFixedColumns);
    adjustFixedColumns();
  }
}

function getOS() {
  const ua = navigator.userAgent;
  if (ua.indexOf("Win") !== -1)
    return "windows";
  if (ua.indexOf("Mac") !== -1)
    return "macos";
  if (ua.indexOf("Linux") !== -1 || ua.indexOf("X11") !== -1)
    return "linux";
}

function initVideoModal() {
  const videoModalObject = $('[data-video-modal]');

  if (videoModalObject.length) {
    // there is a video modal in the DOM, load the YouTube API
    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    const firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

    window.onYouTubeIframeAPIReady = function () {
      window.videoPlayer = new YT.Player('video-player-iframe');
    };
  }

  videoModalObject.on('shown.bs.modal', function (event) {
    if (window.videoPlayer) {
      const videoId = event.relatedTarget.dataset.video;
      window.videoPlayer.loadVideoById(videoId);
      window.videoPlayer.playVideo();
    }
  });

  videoModalObject.on('hide.bs.modal', function (event) {
    if (window.videoPlayer) {
      window.videoPlayer.stopVideo();
    }
  });
}

function initCarousel() {
  const CAROUSEL_SELECTOR = '.carousel';
  const CAROUSEL_ITEM_SELECTOR = '.carousel-item';
  const carousel = $(CAROUSEL_SELECTOR);

  carousel.on('slide.bs.carousel', function (e) {
    carousel.find(CAROUSEL_ITEM_SELECTOR).eq(e.from).addClass('transition-out');
  });
  carousel.on('slid.bs.carousel', function (e) {
    carousel.find(CAROUSEL_ITEM_SELECTOR).eq(e.from).removeClass('transition-out');
  });
}

function initSnackbar() {
  const SNACKBAR_SELECTOR = '.snackbar';
  const SNACKBAR_ACTION_SELECTOR = '.snackbar__action';
  const snackbars = $(SNACKBAR_SELECTOR);

  snackbars.each(function () {
    const snackbar = $(this);
    snackbar.find(SNACKBAR_ACTION_SELECTOR).click(function () {
      snackbar.fadeOut();
    });
  })
}

function setupClipboardJS() {
  const clipboard = new ClipboardJS('.code-excerpt__copy-btn', {
    text: function (trigger) {
      const targetId = trigger.getAttribute('data-clipboard-target');
      const target = document.querySelector(targetId);
      const terminalRegExp = /^(\$\s*)|(C:\\(.*)>\s*)/gm;
      const copy = target.textContent.replace(terminalRegExp, '');
      return copy;
    }
  });
  clipboard.on('success', _copiedFeedback);
}

function _copiedFeedback(e) {
  // e.action === 'copy'
  // e.text === copied text
  e.clearSelection(); // Unselect copied code

  var copied = 'Copied';
  var target = e.trigger;
  var title = target.getAttribute('title') || target.getAttribute('data-original-title')
  var savedTitle;

  if (title === copied) return;

  savedTitle = title;
  setTimeout(function () {
    _changeTooltip(target, savedTitle);
  }, 1500);

  _changeTooltip(target, copied);
}

function _changeTooltip(target, text) {
  target.setAttribute('title', text);
  $(target).tooltip('dispose'); // Dispose of tip with old title
  $(target).tooltip('show'); // Recreate tip with new title ...
  if (!$(target).is(":hover")) {
    $(target).tooltip('hide'); // ... but hide it if it isn't being hovered over
  }
}

function addCopyCodeButtonsEverywhere() {
  var elts = $('pre');
  elts.wrap(function (i) {
    return $(this).parent('div.code-excerpt__code').length === 0
      ? '<div class="code-excerpt__code"></div>'
      : '';
  });
  elts.wrap(function (i) {
    return '<div id="code-excerpt-' + i + '"></div>'
  });

  elts.parent() // === div#code-excerpt-X
    .parent() // === div.code-excerpt__code
    .prepend(function (i) {
      return '' +
        '<button class="code-excerpt__copy-btn" type="button"' +
        '    data-toggle="tooltip" title="Copy code"' +
        '    data-clipboard-target="#code-excerpt-' + i + '">' +
        '  <i class="material-icons">content_copy</i>' +
        '</button>';
    });
}
