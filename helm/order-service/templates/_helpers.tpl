{{/*
===========================================================================
  Grocery-App Helm Chart — Template Helpers
===========================================================================
*/}}

{{/*
Expand the name of the chart.
*/}}
{{- define "grocery-app.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
We truncate at 63 chars because some Kubernetes name fields are limited.
*/}}
{{- define "grocery-app.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "grocery-app.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels applied to all resources.
*/}}
{{- define "grocery-app.labels" -}}
helm.sh/chart: {{ include "grocery-app.chart" . }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
app.kubernetes.io/part-of: grocery-app
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}

{{/*
Selector labels for a specific component.
Usage: {{ include "grocery-app.selectorLabels" (dict "context" . "component" "auth-service") }}
*/}}
{{- define "grocery-app.selectorLabels" -}}
app.kubernetes.io/name: {{ .component }}
app.kubernetes.io/instance: {{ .context.Release.Name }}
{{- end }}

{{/*
Generate a full component name.
Usage: {{ include "grocery-app.componentName" (dict "context" . "component" "auth-service") }}
*/}}
{{- define "grocery-app.componentName" -}}
{{ .component }}
{{- end }}

{{/*
Component labels — merges common + selector labels.
Usage: {{ include "grocery-app.componentLabels" (dict "context" . "component" "auth-service") }}
*/}}
{{- define "grocery-app.componentLabels" -}}
{{ include "grocery-app.labels" .context }}
{{ include "grocery-app.selectorLabels" (dict "context" .context "component" .component) }}
app.kubernetes.io/component: {{ .component }}
{{- end }}

{{/*
MongoDB connection URI helper.
Usage: {{ include "grocery-app.mongoUri" (dict "context" . "database" "grocery_auth" "secretKey" "auth") }}
*/}}
{{- define "grocery-app.mongoUri" -}}
{{- if and .context.Values.mongodb.enabled (not (index .context.Values.secrets.mongoUri .secretKey)) }}
{{- printf "mongodb://%s-mongodb:%s/%s" (include "grocery-app.fullname" .context) (toString .context.Values.mongodb.port) .database }}
{{- else }}
{{- index .context.Values.secrets.mongoUri .secretKey }}
{{- end }}
{{- end }}

{{/*
Image pull secrets helper.
*/}}
{{- define "grocery-app.imagePullSecrets" -}}
{{- if .Values.global.imagePullSecrets }}
imagePullSecrets:
{{- range .Values.global.imagePullSecrets }}
  - name: {{ .name }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Pod anti-affinity helper for spreading pods across nodes.
Usage: {{ include "grocery-app.podAntiAffinity" (dict "component" "auth-service") }}
*/}}
{{- define "grocery-app.podAntiAffinity" -}}
affinity:
  podAntiAffinity:
    preferredDuringSchedulingIgnoredDuringExecution:
      - weight: 100
        podAffinityTerm:
          labelSelector:
            matchExpressions:
              - key: app.kubernetes.io/name
                operator: In
                values:
                  - {{ .component }}
          topologyKey: kubernetes.io/hostname
{{- end }}

{{/*
Standard security context for backend services (Node.js).
*/}}
{{- define "grocery-app.backendSecurityContext" -}}
securityContext:
  runAsNonRoot: true
  runAsUser: 1000
  fsGroup: 1000
{{- end }}

{{/*
Standard container security context.
*/}}
{{- define "grocery-app.containerSecurityContext" -}}
securityContext:
  allowPrivilegeEscalation: false
  readOnlyRootFilesystem: false
  capabilities:
    drop:
      - ALL
{{- end }}

{{/*
Standard security context for frontend services (Nginx).
*/}}
{{- define "grocery-app.frontendSecurityContext" -}}
securityContext:
  runAsNonRoot: true
  runAsUser: 101
  fsGroup: 101
{{- end }}
