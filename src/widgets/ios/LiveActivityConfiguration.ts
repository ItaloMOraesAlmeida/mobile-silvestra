/**
 * iOS Live Activity Module Configuration
 *
 * Este arquivo documenta a configuração necessária para implementar
 * Live Activities no iOS para o módulo de hidratação.
 *
 * IMPORTANTE: Live Activities requerem código nativo Swift e configuração
 * adicional no projeto iOS. Este é um guia para implementação futura.
 */

/**
 * 1. CONFIGURAÇÃO DO PROJETO
 *
 * No arquivo ios/Podfile, adicionar:
 *
 * target 'SilvestraApp' do
 *   # ... outras configurações
 *
 *   # Live Activities
 *   pod 'ActivityKit', '~> 1.0'
 * end
 */

/**
 * 2. CRIAR WIDGET EXTENSION
 *
 * No Xcode:
 * 1. File → New → Target → Widget Extension
 * 2. Nome: "WaterTrackingWidget"
 * 3. Include Live Activity: YES
 *
 * Estrutura de arquivos:
 * ios/
 * ├── WaterTrackingWidget/
 * │   ├── WaterTrackingWidget.swift
 * │   ├── WaterTrackingAttributes.swift
 * │   └── Assets.xcassets/
 */

/**
 * 3. WATERTRACKINGATTRIBUTES.SWIFT
 *
 * Definir atributos da Live Activity:
 */

export const WaterTrackingAttributesSwift = `
import ActivityKit
import Foundation

struct WaterTrackingAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        var consumed: Int
        var remaining: Int
        var percent: Int
        var goalAchieved: Bool
    }
    
    var dailyGoal: Int
}
`;

/**
 * 4. WATERTRACKINGWIDGET.SWIFT
 *
 * Implementar UI da Live Activity:
 */

export const WaterTrackingWidgetSwift = `
import ActivityKit
import WidgetKit
import SwiftUI

struct WaterTrackingLiveActivity: Widget {
    var body: some WidgetConfiguration {
        ActivityConfiguration(for: WaterTrackingAttributes.self) { context in
            // Lock Screen / Banner UI
            HStack {
                Image(systemName: "drop.fill")
                    .foregroundColor(.blue)
                    .font(.title2)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text("Hidratação")
                        .font(.headline)
                    
                    HStack {
                        Text("\\(context.state.consumed)ml")
                            .font(.caption)
                            .foregroundColor(.secondary)
                        
                        if !context.state.goalAchieved {
                            Text("Faltam \\(context.state.remaining)ml")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        } else {
                            Text("Meta alcançada! 🎉")
                                .font(.caption)
                                .foregroundColor(.green)
                        }
                    }
                }
                
                Spacer()
                
                // Progress Circle
                ZStack {
                    Circle()
                        .stroke(Color.gray.opacity(0.2), lineWidth: 8)
                        .frame(width: 60, height: 60)
                    
                    Circle()
                        .trim(from: 0, to: CGFloat(context.state.percent) / 100)
                        .stroke(
                            context.state.goalAchieved ? Color.green : Color.blue,
                            style: StrokeStyle(lineWidth: 8, lineCap: .round)
                        )
                        .frame(width: 60, height: 60)
                        .rotationEffect(.degrees(-90))
                    
                    Text("\\(context.state.percent)%")
                        .font(.system(size: 16, weight: .bold))
                }
            }
            .padding()
            .activityBackgroundTint(Color.white)
            
        } dynamicIsland: { context in
            DynamicIsland {
                // Expanded UI
                DynamicIslandExpandedRegion(.leading) {
                    Image(systemName: "drop.fill")
                        .foregroundColor(.blue)
                        .font(.title2)
                }
                
                DynamicIslandExpandedRegion(.trailing) {
                    VStack(alignment: .trailing) {
                        Text("\\(context.state.percent)%")
                            .font(.title2)
                            .foregroundColor(
                                context.state.goalAchieved ? .green : .blue
                            )
                    }
                }
                
                DynamicIslandExpandedRegion(.bottom) {
                    VStack(spacing: 8) {
                        ProgressView(value: Double(context.state.percent) / 100)
                            .tint(context.state.goalAchieved ? .green : .blue)
                        
                        Text("\\(context.state.consumed)ml de \\(context.attributes.dailyGoal)ml")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            } compactLeading: {
                Image(systemName: "drop.fill")
                    .foregroundColor(.blue)
            } compactTrailing: {
                Text("\\(context.state.percent)%")
                    .font(.caption2)
                    .foregroundColor(.blue)
            } minimal: {
                Image(systemName: "drop.fill")
                    .foregroundColor(.blue)
            }
        }
    }
}
`;

/**
 * 5. NATIVE MODULE (LiveActivityModule.swift)
 *
 * Bridge entre React Native e Swift:
 */

export const LiveActivityModuleSwift = `
import ActivityKit
import Foundation

@objc(LiveActivityModule)
class LiveActivityModule: NSObject {
    private var currentActivity: Activity<WaterTrackingAttributes>?
    
    @objc
    func startActivity(
        _ activityId: String,
        attributes: NSDictionary,
        contentState: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        let attrs = WaterTrackingAttributes(
            dailyGoal: attributes["dailyGoal"] as? Int ?? 2000
        )
        
        let state = WaterTrackingAttributes.ContentState(
            consumed: contentState["consumed"] as? Int ?? 0,
            remaining: contentState["remaining"] as? Int ?? 2000,
            percent: contentState["percent"] as? Int ?? 0,
            goalAchieved: contentState["goalAchieved"] as? Bool ?? false
        )
        
        do {
            currentActivity = try Activity<WaterTrackingAttributes>.request(
                attributes: attrs,
                contentState: state,
                pushType: nil
            )
            resolve(currentActivity?.id)
        } catch {
            reject("ERROR", "Failed to start activity", error)
        }
    }
    
    @objc
    func updateActivity(
        _ activityId: String,
        contentState: NSDictionary,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let activity = currentActivity else {
            reject("ERROR", "No active activity", nil)
            return
        }
        
        let state = WaterTrackingAttributes.ContentState(
            consumed: contentState["consumed"] as? Int ?? 0,
            remaining: contentState["remaining"] as? Int ?? 2000,
            percent: contentState["percent"] as? Int ?? 0,
            goalAchieved: contentState["goalAchieved"] as? Bool ?? false
        )
        
        Task {
            await activity.update(using: state)
            resolve(true)
        }
    }
    
    @objc
    func endActivity(
        _ activityId: String,
        resolver resolve: @escaping RCTPromiseResolveBlock,
        rejecter reject: @escaping RCTPromiseRejectBlock
    ) {
        guard let activity = currentActivity else {
            reject("ERROR", "No active activity", nil)
            return
        }
        
        Task {
            await activity.end(dismissalPolicy: .default)
            currentActivity = nil
            resolve(true)
        }
    }
    
    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
`;

/**
 * 6. APP.JSON CONFIGURATION
 *
 * Adicionar ao app.json:
 */

export const AppJsonConfiguration = {
  expo: {
    ios: {
      infoPlist: {
        NSSupportsLiveActivities: true,
      },
      entitlements: {
        "com.apple.developer.live-activities": true,
      },
    },
  },
};

/**
 * 7. INSTRUÇÕES DE BUILD
 *
 * Para compilar com Live Activities:
 *
 * 1. cd ios && pod install
 * 2. Abrir Xcode
 * 3. Selecionar target "WaterTrackingWidget"
 * 4. Build Settings → iOS Deployment Target: 16.1+
 * 5. Assinar Widget Extension com mesmo Team ID
 * 6. Build e testar em dispositivo físico (não funciona no simulador)
 */

/**
 * 8. COMO USAR NO REACT NATIVE
 *
 * Exemplo de uso após implementação nativa:
 */

export const UsageExample = `
import { liveActivityService } from './widgets/ios/liveActivityService';

// Iniciar Live Activity ao abrir dashboard
const startLiveActivity = async () => {
  const summary = await getTodaySummary();
  
  await liveActivityService.start({
    consumed: summary.consumed,
    goal: summary.goal,
    percent: summary.percent,
    remaining: summary.remaining,
    goalAchieved: summary.goalAchieved,
  });
};

// Atualizar ao adicionar água
const handleAddWater = async (amount: number) => {
  await createWaterLog(amount);
  
  const newSummary = await getTodaySummary();
  await liveActivityService.update({
    consumed: newSummary.consumed,
    goal: newSummary.goal,
    percent: newSummary.percent,
    remaining: newSummary.remaining,
    goalAchieved: newSummary.goalAchieved,
  });
};

// Finalizar ao fechar app ou fim do dia
await liveActivityService.end();
`;

/**
 * NOTA: Live Activities são uma feature avançada que requer:
 * - iOS 16.1+
 * - Dispositivo físico (não funciona no simulador)
 * - Código nativo Swift
 * - Widget Extension configurada
 * - Certificado de desenvolvimento Apple
 *
 * Este arquivo serve como documentação e guia para implementação futura.
 * O serviço liveActivityService.ts já está preparado para funcionar
 * quando o módulo nativo for implementado.
 */
