package fetch

import (
	"bufio"
	"strings"
)

// Robots is een minimale robots.txt implementatie (RFC 9309): groepen per
// user-agent, Allow/Disallow met `*` en `$` wildcards, langste match wint.
type Robots struct {
	rules []robotsRule
}

type robotsRule struct {
	allow   bool
	pattern string
}

// ParseRobots kiest de groep die het best bij agentToken past, anders de `*` groep.
func ParseRobots(body string, agentToken string) *Robots {
	agentToken = strings.ToLower(agentToken)
	type group struct {
		agents []string
		rules  []robotsRule
	}
	var groups []*group
	var cur *group
	lastWasAgent := false

	sc := bufio.NewScanner(strings.NewReader(body))
	for sc.Scan() {
		line := sc.Text()
		if i := strings.IndexByte(line, '#'); i >= 0 {
			line = line[:i]
		}
		key, val, ok := strings.Cut(line, ":")
		if !ok {
			continue
		}
		key = strings.ToLower(strings.TrimSpace(key))
		val = strings.TrimSpace(val)
		switch key {
		case "user-agent":
			if cur == nil || !lastWasAgent {
				cur = &group{}
				groups = append(groups, cur)
			}
			cur.agents = append(cur.agents, strings.ToLower(val))
			lastWasAgent = true
		case "allow", "disallow":
			lastWasAgent = false
			if cur == nil || val == "" && key == "disallow" {
				continue
			}
			cur.rules = append(cur.rules, robotsRule{allow: key == "allow", pattern: val})
		default:
			lastWasAgent = false
		}
	}

	var specific, wildcard []robotsRule
	foundSpecific := false
	for _, g := range groups {
		for _, a := range g.agents {
			switch {
			case a == "*":
				wildcard = append(wildcard, g.rules...)
			case agentToken != "" && strings.Contains(agentToken, a):
				specific = append(specific, g.rules...)
				foundSpecific = true
			}
		}
	}
	if foundSpecific {
		return &Robots{rules: specific}
	}
	return &Robots{rules: wildcard}
}

// Allowed meldt of het pad (inclusief query string) gecrawld mag worden.
func (r *Robots) Allowed(pathAndQuery string) bool {
	if r == nil {
		return true
	}
	if pathAndQuery == "" {
		pathAndQuery = "/"
	}
	bestLen := -1
	allowed := true
	for _, rule := range r.rules {
		if !robotsMatch(rule.pattern, pathAndQuery) {
			continue
		}
		l := len(rule.pattern)
		if l > bestLen || (l == bestLen && rule.allow) {
			bestLen = l
			allowed = rule.allow
		}
	}
	return allowed
}

// robotsMatch matcht een robots.txt patroon met `*` (willekeurige reeks) en een
// optionele `$` (einde van de URL).
func robotsMatch(pattern, path string) bool {
	anchored := strings.HasSuffix(pattern, "$")
	if anchored {
		pattern = strings.TrimSuffix(pattern, "$")
	}
	parts := strings.Split(pattern, "*")
	if !strings.HasPrefix(path, parts[0]) {
		return false
	}
	pos := len(parts[0])
	for i := 1; i < len(parts); i++ {
		p := parts[i]
		if i == len(parts)-1 && anchored {
			return strings.HasSuffix(path[pos:], p)
		}
		idx := strings.Index(path[pos:], p)
		if idx < 0 {
			return false
		}
		pos += idx + len(p)
	}
	if anchored {
		return pos == len(path)
	}
	return true
}
