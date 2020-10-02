// TODO(chalin): package archive.js as its own top-level js so that it can be loaded independently

// Number of releases to show by default (rest will be behind a "show all" link).
const releasesToShow = 99999;

// Fetches Flutter release JSON for the given OS and calls the callback once the data is available.
const fetchFlutterReleases = function (os, callback, errorCallback) {
  // OS: windows, macos, linux
  const url = "https://storage.googleapis.com/flutter_infra/releases/releases_" + os + ".json";
  $.ajax({
    type: "GET",
    url: url,
    dataType: "json",
    success: function (data) {
      callback(data, os);
    },
    error: function (xhr, textStatus, errorThrown) {
      if (errorCallback) errorCallback(os);
    }
  })
};

function updateTable(releases, os) {
  const releaseData = releases.releases;

  for (const channel in releases.current_release) {
    const table = $("#downloads-" + os + "-" + channel);
    table.addClass("collapsed").find(".loading").remove();

    const releasesForChannel = releaseData.filter(function (release) {
      return release.channel == channel;
    });

    releasesForChannel.forEach(function (release, index) {
      // If this is the first row after the cut-off, insert the "Show more..." link.
      if (index === releasesToShow) {
        const showAll = $("<a />").text("Show all...").attr("href", "#").click(function (event) {
          $(this).closest("table").removeClass("collapsed");
          $(this).closest("tr").remove();
          event.preventDefault();
        });
        $("<tr>").append($("<td colspan=\"3\"></td></tr>").append(showAll)).appendTo(table);
      }

      const className = index >= releasesToShow ? "overflow" : "";
      const url = releases.base_url + "/" + release.archive;
      const row = $("<tr />").addClass(className).appendTo(table);
      const hashLabel = $("<span />").text(release.hash.substr(0, 7)).addClass("git-hash");
      const downloadLink = $("<a />").attr("href", url).text(release.version);
      const date = new Date(Date.parse(release.release_date));
      $("<td />").append(downloadLink).appendTo(row);
      $("<td />").append(hashLabel).appendTo(row);
      $("<td />").addClass("date").text(date.toLocaleDateString()).appendTo(row);
    });
  }
}

function updateTableFailed(os) {
  const tab = $("#tab-os-" + os);
  tab.find(".loading").text("Failed to load releases. Refresh page to try again.");
}

function updateDownloadLink(releases, os) {
  const channel = "stable";
  const releasesForChannel = releases.releases.filter(function (release) {
    return release.channel == channel;
  });
  if (!releasesForChannel.length)
    return;

  const release = releasesForChannel[0];
  const linkSegments = release.archive.split("/");
  const archiveFilename = linkSegments[linkSegments.length - 1]; // Just the filename part of url
  const downloadLink = $(".download-latest-link-" + os);
  downloadLink
    .text(archiveFilename)
    .attr("href", releases.base_url + "/" + release.archive);

  // Update download-filename placeholders:
  $(".download-latest-link-filename-" + os).text(archiveFilename);
  $(".download-latest-link-filename").text(archiveFilename);

  // Update inlined filenames in <code> element text nodes:
  const fileNamePrefix = 'flutter_';
  const code = $('code:contains("' + fileNamePrefix + '")');
  const textNode = $(code).contents().filter(function () {
    return this.nodeType == 3 && this.textContent.includes(fileNamePrefix);
  });
  const text = $(textNode).text();
  const newText = text.replace(new RegExp('^(.*?)\\b' + fileNamePrefix + '\\w+_v.*'), '$1' + archiveFilename);
  $(textNode).replaceWith(newText);
}

function updateDownloadLinkFailed(os) {
  $(".download-latest-link-" + os).text("(failed)");
}

// Send requests to render the tables.
$(function () {
  if ($("#sdk-archives").length) {
    fetchFlutterReleases("windows", updateTable, updateTableFailed);
    fetchFlutterReleases("macos", updateTable, updateTableFailed);
    fetchFlutterReleases("linux", updateTable, updateTableFailed);
  }
  if ($(".download-latest-link-windows").length)
    fetchFlutterReleases("windows", updateDownloadLink, updateDownloadLinkFailed);
  if ($(".download-latest-link-macos").length)
    fetchFlutterReleases("macos", updateDownloadLink, updateDownloadLinkFailed);
  if ($(".download-latest-link-linux").length)
    fetchFlutterReleases("linux", updateDownloadLink, updateDownloadLinkFailed);
});

