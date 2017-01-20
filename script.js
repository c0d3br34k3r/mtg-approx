var cards = [];
var request = new XMLHttpRequest();
request.onreadystatechange = function() {
    if (request.readyState == 4 && request.status == 200) {
		var mtgjson = JSON.parse(request.responseText);
		var set = new Set();
		for (var key of Object.keys(mtgjson)) {
			for (card of mtgjson[key].cards) {
				var name;
				switch (card.layout) {
					case 'normal':
					case 'leveler':
						set.add(Diacritics.remove(card.name));
						break;
					case 'split':
						set.add(Diacritics.remove(card.names.join(' // ')));
						break;
					case 'flip':
					case 'double-faced':
						set.add(Diacritics.remove(card.names[0]));
						break;
					case 'meld':
						set.add(Diacritics.remove(card.names[0]));
						set.add(Diacritics.remove(card.names[1]));
						break;
					default:
						break;
				}
			}
		}
		cards = Array.from(set);
    }
};

request.overrideMimeType('application/json');
request.open('GET', './AllSets.json', true);
request.send();

var dialog = false;
var lineStart;
var lineEnd;

function keypress(e) {
	if (dialog) {
		if (!e.shiftKey) {
			var key = e.key.replace('Enter', '1');
			if (/^[0-9]$/.test(key)) {
				replaceLine(key.replace('0', '10') - 1, true);
				e.preventDefault();
			}
		}
		hideDialog();
	} else if (e.key == 'Enter' && !e.shiftKey) {
		var list = document.getElementById('list');
		if (list.selectionStart == list.selectionEnd
				&& (!list.value[list.selectionStart] || list.value[list.selectionStart] == '\n')) {
			lineStart = list.value.lastIndexOf('\n', list.selectionStart - 1) + 1;
			lineEnd = list.selectionStart;
			var line = list.value.substring(lineStart, lineEnd);
			if (line.length >= 3) {
				var perfectMatch = getMatches(line);
				if (perfectMatch) {
					replaceLine(0);
				} else {
					showDialog();
				}
				e.preventDefault();
			}
		}
	}
}

function replaceLine(index) {
	list.value = list.value.substring(0, lineStart) + entries[index].name + '\n' + list.value.substring(lineEnd);
	newCaretPosition = lineStart + entries[index].name.length + 1;
	list.setSelectionRange(newCaretPosition, newCaretPosition);
}

var MATCHES = 10;
var entries = new Array(MATCHES);
var DUMMY = {
	score: Number.MAX_VALUE
};

function getMatches(input) {
	var name = input.toLowerCase();
	entries.fill(DUMMY);
	var threshold = Number.MAX_VALUE;
	for (var i = 0, len = cards.length; i < len; i++) {
		var distance = levenshtein(cards[i].toLowerCase(), name);
		if (distance < threshold) {
			entries[MATCHES - 1] = { name: cards[i], score: distance };
			entries.sort(comparator);
			if (distance == 0) {
				return true;
			}
			threshold = entries[MATCHES - 1].score;
		}
	}
	return false;
}

function comparator(e1, e2) {
	return e1.score - e2.score;
}

function showDialog() {
	dialog = true;
	document.getElementById('dialog').style.display = 'block';
	html = '<ol>';
	for (var i = 0; i < MATCHES; i++) {
		html += ('<li onclick="selectItem(' + i + ')">' + entries[i].name + '</li>');
	}
	html += '</ol>';
	document.getElementById('dialog').innerHTML = html;
}

function selectItem(index) {
	replaceLine(index);
	hideDialog();
	document.getElementById('list').focus();
}

function hideDialog() {
	dialog = false;
	document.getElementById('dialog').style.display = 'none';
}

window.onload = function() {
	document.getElementById('list').value = '';
	document.getElementById('list').focus();
}

window.onbeforeunload = function() {
	if (document.getElementById('list').value) {
		return 'Warning! Entered text will be lost.';
	}
};
